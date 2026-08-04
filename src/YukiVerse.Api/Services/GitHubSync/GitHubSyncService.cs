using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;
using YukiVerse.Api.Data;
using YukiVerse.Api.Domain;
using YukiVerse.Api.Infrastructure.GitHub;

namespace YukiVerse.Api.Services.GitHubSync;

/// <summary>
/// Pulls push events from the GitHub API and persists only the rows that are not
/// already present, keeping every re-run idempotent. GitHub hard-caps event history
/// at 300 entries, so only recent activity is available via this endpoint.
/// </summary>
public class GitHubSyncService
{
    private readonly YukiVerseDbContext _db;
    private readonly GitHubClient _client;
    private readonly string _username;
    private readonly ILogger<GitHubSyncService> _logger;

    public GitHubSyncService(
        YukiVerseDbContext db,
        GitHubClient client,
        IConfiguration config,
        ILogger<GitHubSyncService> logger)
    {
        _db = db;
        _client = client;
        _username = config["GITHUB_USERNAME"]
            ?? throw new InvalidOperationException("GITHUB_USERNAME is not set in configuration.");
        _logger = logger;
    }

    public async Task<GitHubSyncResult> SyncAsync(CancellationToken ct = default)
    {
        var platform = await _db.Platforms
            .FirstAsync(p => p.Name == PlatformSlugs.GitHub, ct);

        try
        {
            var newCount = await RunSyncAsync(platform, ct);

            _db.SyncLogs.Add(new SyncLog
            {
                PlatformId = platform.Id,
                LastSyncAt = DateTime.UtcNow,
                Status = SyncStatuses.Success
            });
            await _db.SaveChangesAsync(CancellationToken.None);

            _logger.LogInformation("GitHub sync complete: {Count} new push events.", newCount);
            return new GitHubSyncResult(newCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GitHub sync failed for user '{Username}'", _username);

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

    private async Task<int> RunSyncAsync(Platform platform, CancellationToken ct)
    {
        var events = await _client.GetPushEventsAsync(_username, ct);

        var existingIds = (await _db.ActivityLogs
            .Where(a => a.PlatformId == platform.Id && a.ExternalId != null)
            .Select(a => a.ExternalId!)
            .ToListAsync(ct))
            .ToHashSet();

        var newLogs = events
            .Where(e => !existingIds.Contains(e.Id))
            .Select(e => new ActivityLog
            {
                PlatformId = platform.Id,
                Type = ActivityTypes.Commit,
                Title = e.Repo.Name,
                Verdict = null,
                ExternalId = e.Id,
                OccurredAt = e.CreatedAt
            })
            .ToList();

        if (newLogs.Count > 0)
        {
            _db.ActivityLogs.AddRange(newLogs);
            await _db.SaveChangesAsync(ct);
        }

        // Always recalculate so a previous partial failure is recovered on the next run.
        await UpsertDailyActivitiesAsync(platform.Id, ct);

        return newLogs.Count;
    }

    /// <summary>
    /// Recalculates push-event counts for all dates and upserts into daily_activities.
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
}

/// <summary>Summary returned to the caller after a successful sync.</summary>
public record GitHubSyncResult(int NewPushEvents);
