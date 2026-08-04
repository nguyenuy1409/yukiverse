using Microsoft.EntityFrameworkCore;
using Npgsql;
using YukiVerse.Api.Data;
using YukiVerse.Api.Domain;
using YukiVerse.Api.Infrastructure.AtCoder;

namespace YukiVerse.Api.Services.AtCoderSync;

/// <summary>
/// Pulls submissions and rating history from the kenkoooo AtCoder Problems API
/// and the AtCoder user history endpoint, persisting only new rows each run.
/// </summary>
public class AtCoderSyncService
{
    private readonly YukiVerseDbContext _db;
    private readonly AtCoderClient _client;
    private readonly string _handle;
    private readonly ILogger<AtCoderSyncService> _logger;

    public AtCoderSyncService(
        YukiVerseDbContext db,
        AtCoderClient client,
        IConfiguration config,
        ILogger<AtCoderSyncService> logger)
    {
        _db = db;
        _client = client;
        _handle = config["AC_HANDLE"]
            ?? throw new InvalidOperationException("AC_HANDLE is not set in configuration.");
        _logger = logger;
    }

    public async Task<AtCoderSyncResult> SyncAsync(CancellationToken ct = default)
    {
        var platform = await _db.Platforms
            .FirstAsync(p => p.Name == PlatformSlugs.AtCoder, ct);

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
                "AtCoder sync complete: {Submissions} new submissions, {Ratings} new rating entries.",
                newSubmissions, newRatings);

            return new AtCoderSyncResult(newSubmissions, newRatings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AtCoder sync failed for handle '{Handle}'", _handle);

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
                Title = BuildProblemTitle(s),
                Verdict = s.Result,
                ExternalId = s.Id.ToString(),
                OccurredAt = DateTimeOffset.FromUnixTimeSeconds(s.EpochSecond).UtcDateTime
            })
            .ToList();

        if (newLogs.Count > 0)
        {
            _db.ActivityLogs.AddRange(newLogs);
            await _db.SaveChangesAsync(ct);
        }

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
            .Where(r => r.IsRated && !existingContestNames.Contains(r.ContestScreenName))
            .Select(r => new RatingHistory
            {
                PlatformId = platform.Id,
                ContestName = r.ContestScreenName,
                Rating = r.NewRating,
                Rank = r.Place,
                Date = r.EndTime.UtcDateTime
            })
            .ToList();

        if (newRatings.Count > 0)
        {
            _db.RatingHistory.AddRange(newRatings);
            await _db.SaveChangesAsync(ct);
        }

        return (newLogs.Count, newRatings.Count);
    }

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

    private async Task UpsertProblemStatsAsync(int platformId, CancellationToken ct)
    {
        var totalSolved = await _db.ActivityLogs
            .Where(a => a.PlatformId == platformId && a.Verdict == "AC")
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
    /// Formats a problem title as "ABC300 A" by extracting the problem letter from
    /// the problem_id (which follows the pattern "{contest_id}_{letter}").
    /// Falls back to the raw problem_id for non-standard formats.
    /// </summary>
    private static string BuildProblemTitle(AcSubmission s)
    {
        var prefix = s.ContestId + "_";
        var letter = s.ProblemId.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? s.ProblemId[prefix.Length..].ToUpper()
            : s.ProblemId;

        return $"{s.ContestId.ToUpper()} {letter}";
    }
}

/// <summary>Summary returned to the caller after a successful sync.</summary>
public record AtCoderSyncResult(int NewSubmissions, int NewRatingEntries);
