using Microsoft.EntityFrameworkCore;
using Npgsql;
using YukiVerse.Api.Data;
using YukiVerse.Api.Domain;
using YukiVerse.Api.Infrastructure.LeetCode;

namespace YukiVerse.Api.Services.LeetCodeSync;

/// <summary>
/// Fetches individual submission records from LeetCode using the stored session cookie
/// and persists new entries as activity_logs. When the cookie has expired the service
/// records a needs_refresh status and returns gracefully without throwing.
/// </summary>
public class LeetCodeSubmissionSyncService
{
    private readonly YukiVerseDbContext _db;
    private readonly LeetCodeClient _client;
    private readonly string _sessionCookie;
    private readonly ILogger<LeetCodeSubmissionSyncService> _logger;

    public LeetCodeSubmissionSyncService(
        YukiVerseDbContext db,
        LeetCodeClient client,
        IConfiguration config,
        ILogger<LeetCodeSubmissionSyncService> logger)
    {
        _db = db;
        _client = client;
        _sessionCookie = config["LC_SESSION_COOKIE"] ?? string.Empty;
        _logger = logger;
    }

    public async Task<LeetCodeSubmissionSyncResult> SyncAsync(CancellationToken ct = default)
    {
        var platform = await _db.Platforms
            .FirstAsync(p => p.Name == PlatformSlugs.LeetCode, ct);

        if (string.IsNullOrWhiteSpace(_sessionCookie))
        {
            _logger.LogWarning("LC_SESSION_COOKIE is not configured. Skipping submission sync.");
            return new LeetCodeSubmissionSyncResult(0, SyncStatuses.NeedsRefresh);
        }

        try
        {
            var submissions = await _client.GetAllSubmissionsAsync(_sessionCookie, ct);

            // Null means the session cookie was rejected by LeetCode.
            if (submissions is null)
            {
                _logger.LogWarning("LeetCode session cookie has expired. Recording needs_refresh.");

                _db.SyncLogs.Add(new SyncLog
                {
                    PlatformId   = platform.Id,
                    LastSyncAt   = DateTime.UtcNow,
                    Status       = SyncStatuses.NeedsRefresh,
                    ErrorMessage = "Session cookie expired. Update LC_SESSION_COOKIE to resume syncing."
                });
                await _db.SaveChangesAsync(CancellationToken.None);

                return new LeetCodeSubmissionSyncResult(0, SyncStatuses.NeedsRefresh);
            }

            var existingIds = (await _db.ActivityLogs
                .Where(a => a.PlatformId == platform.Id && a.ExternalId != null)
                .Select(a => a.ExternalId!)
                .ToListAsync(ct))
                .ToHashSet();

            var newLogs = submissions
                .Where(s => !existingIds.Contains(s.Id))
                .Select(s => new ActivityLog
                {
                    PlatformId  = platform.Id,
                    Type        = ActivityTypes.Submission,
                    Title       = s.Title,
                    Verdict     = s.StatusDisplay,
                    ExternalId  = s.Id,
                    OccurredAt  = DateTimeOffset.FromUnixTimeSeconds(long.Parse(s.Timestamp)).UtcDateTime
                })
                .ToList();

            if (newLogs.Count > 0)
            {
                _db.ActivityLogs.AddRange(newLogs);
                await _db.SaveChangesAsync(ct);
            }

            await UpsertDailyActivitiesAsync(platform.Id, ct);

            _db.SyncLogs.Add(new SyncLog
            {
                PlatformId = platform.Id,
                LastSyncAt = DateTime.UtcNow,
                Status     = SyncStatuses.Success
            });
            await _db.SaveChangesAsync(CancellationToken.None);

            _logger.LogInformation(
                "LeetCode submission sync complete: {Count} new submissions.", newLogs.Count);

            return new LeetCodeSubmissionSyncResult(newLogs.Count, SyncStatuses.Success);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LeetCode submission sync failed");

            _db.SyncLogs.Add(new SyncLog
            {
                PlatformId   = platform.Id,
                LastSyncAt   = DateTime.UtcNow,
                Status       = SyncStatuses.Failed,
                ErrorMessage = ex.Message.Length > 500 ? ex.Message[..500] : ex.Message
            });
            await _db.SaveChangesAsync(CancellationToken.None);

            throw;
        }
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
}

/// <summary>Summary returned after a submission sync attempt.</summary>
public record LeetCodeSubmissionSyncResult(int NewSubmissions, string Status);
