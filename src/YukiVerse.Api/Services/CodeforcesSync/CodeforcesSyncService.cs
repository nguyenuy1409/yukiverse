using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;
using YukiVerse.Api.Data;
using YukiVerse.Api.Domain;
using YukiVerse.Api.Infrastructure.Codeforces;

namespace YukiVerse.Api.Services.CodeforcesSync;

/// <summary>
/// Pulls submissions and rating history from the Codeforces public API and persists
/// only the rows that are not already present, keeping every re-run idempotent.
/// </summary>
public class CodeforcesSyncService
{
    private readonly YukiVerseDbContext _db;
    private readonly CodeforcesClient _client;
    private readonly string _handle;
    private readonly ILogger<CodeforcesSyncService> _logger;

    public CodeforcesSyncService(
        YukiVerseDbContext db,
        CodeforcesClient client,
        IConfiguration config,
        ILogger<CodeforcesSyncService> logger)
    {
        _db = db;
        _client = client;
        _handle = config["CF_HANDLE"]
            ?? throw new InvalidOperationException("CF_HANDLE is not set in configuration.");
        _logger = logger;
    }

    public async Task<CodeforcesSyncResult> SyncAsync(CancellationToken ct = default)
    {
        var platform = await _db.Platforms
            .FirstAsync(p => p.Name == PlatformSlugs.Codeforces, ct);

        try
        {
            var (newSubmissions, newRatings) = await RunSyncAsync(platform, ct);

            _db.SyncLogs.Add(new SyncLog
            {
                PlatformId = platform.Id,
                LastSyncAt = DateTime.UtcNow,
                Status = SyncStatuses.Success
            });
            await _db.SaveChangesAsync(CancellationToken.None);

            _logger.LogInformation(
                "Codeforces sync complete: {Submissions} new submissions, {Ratings} new rating entries.",
                newSubmissions, newRatings);

            return new CodeforcesSyncResult(newSubmissions, newRatings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Codeforces sync failed for handle '{Handle}'", _handle);

            _db.SyncLogs.Add(new SyncLog
            {
                PlatformId = platform.Id,
                LastSyncAt = DateTime.UtcNow,
                Status = SyncStatuses.Failed,
                ErrorMessage = ex.Message.Length > 500 ? ex.Message[..500] : ex.Message
            });
            await _db.SaveChangesAsync(CancellationToken.None);

            throw;
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private async Task<(int NewSubmissions, int NewRatings)> RunSyncAsync(
        Platform platform, CancellationToken ct)
    {
        // --- Submissions ---

        var submissions = await _client.GetSubmissionsAsync(_handle, ct);

        var existingIds = (await _db.ActivityLogs
            .Where(a => a.PlatformId == platform.Id && a.ExternalId != null)
            .Select(a => a.ExternalId!)
            .ToListAsync(ct))
            .ToHashSet();

        var newLogs = submissions
            .Where(s => !existingIds.Contains(s.Id.ToString()))
            .Select(s => new ActivityLog
            {
                PlatformId = platform.Id,
                Type = ActivityTypes.Submission,
                Title = BuildProblemTitle(s.Problem),
                Verdict = s.Verdict,
                ExternalId = s.Id.ToString(),
                OccurredAt = DateTimeOffset.FromUnixTimeSeconds(s.CreationTimeSeconds).UtcDateTime
            })
            .ToList();

        if (newLogs.Count > 0)
        {
            _db.ActivityLogs.AddRange(newLogs);
            await _db.SaveChangesAsync(ct);
        }

        // Always recalculate so a previous partial failure (submissions saved but
        // daily counts not yet written) is automatically recovered on the next run.
        await UpsertDailyActivitiesAsync(platform.Id, ct);
        await UpsertProblemStatsAsync(platform.Id, ct);

        // --- Rating history ---

        var ratingChanges = await _client.GetRatingHistoryAsync(_handle, ct);

        var existingContestNames = (await _db.RatingHistory
            .Where(r => r.PlatformId == platform.Id && r.ContestName != null)
            .Select(r => r.ContestName!)
            .ToListAsync(ct))
            .ToHashSet();

        var newRatings = ratingChanges
            .Where(r => !existingContestNames.Contains(r.ContestName))
            .Select(r => new RatingHistory
            {
                PlatformId = platform.Id,
                ContestName = r.ContestName,
                Rating = r.NewRating,
                Rank = r.Rank,
                Date = DateTimeOffset.FromUnixTimeSeconds(r.RatingUpdateTimeSeconds).UtcDateTime
            })
            .ToList();

        if (newRatings.Count > 0)
        {
            _db.RatingHistory.AddRange(newRatings);
            await _db.SaveChangesAsync(ct);
        }

        return (newLogs.Count, newRatings.Count);
    }

    /// <summary>
    /// Recalculates submission counts for all dates and writes them to
    /// daily_activities using an upsert so repeated syncs stay consistent.
    /// Running unconditionally also recovers from any partial failure on previous syncs.
    /// </summary>
    private async Task UpsertDailyActivitiesAsync(int platformId, CancellationToken ct)
    {
        var platformParam = new NpgsqlParameter<int>("platformId", platformId);

        await _db.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO daily_activities (platform_id, date, count, updated_at)
            SELECT @platformId, occurred_at::date, COUNT(*), NOW()
            FROM activity_logs
            WHERE platform_id = @platformId
            GROUP BY occurred_at::date
            ON CONFLICT (platform_id, date) DO UPDATE
              SET count      = EXCLUDED.count,
                  updated_at = EXCLUDED.updated_at
            """,
            new object[] { platformParam }, ct);
    }

    /// <summary>
    /// Counts distinct problems solved (title with verdict "OK") and upserts the
    /// problem_stats row for the platform. Difficulty fields are left null for Codeforces
    /// since it does not expose easy / medium / hard categories.
    /// </summary>
    private async Task UpsertProblemStatsAsync(int platformId, CancellationToken ct)
    {
        var totalSolved = await _db.ActivityLogs
            .Where(a => a.PlatformId == platformId && a.Verdict == "OK")
            .Select(a => a.Title)
            .Distinct()
            .CountAsync(ct);

        var existing = await _db.ProblemStats
            .FirstOrDefaultAsync(p => p.PlatformId == platformId, ct);

        if (existing is null)
        {
            _db.ProblemStats.Add(new ProblemStats
            {
                PlatformId = platformId,
                TotalSolved = totalSolved,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.TotalSolved = totalSolved;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Formats a problem as "1A - Theatre Square" (with contest prefix when available)
    /// or just the problem name for gym / practice problems without a contest id.
    /// </summary>
    private static string BuildProblemTitle(CfProblem problem)
    {
        return problem.ContestId.HasValue
            ? $"{problem.ContestId}{problem.Index} - {problem.Name}"
            : problem.Name;
    }
}

/// <summary>Summary returned to the caller after a successful sync.</summary>
public record CodeforcesSyncResult(int NewSubmissions, int NewRatingEntries);
