using Microsoft.EntityFrameworkCore;
using YukiVerse.Api.Data;
using YukiVerse.Api.Domain;
using YukiVerse.Api.Infrastructure.LeetCode;

namespace YukiVerse.Api.Services.LeetCodeSync;

/// <summary>
/// Fetches aggregate problem counts from the public LeetCode GraphQL API and
/// upserts the problem_stats row for the LeetCode platform.
/// No session cookie is required for this step.
/// </summary>
public class LeetCodeStatsSyncService
{
    private readonly YukiVerseDbContext _db;
    private readonly LeetCodeClient _client;
    private readonly string _username;
    private readonly ILogger<LeetCodeStatsSyncService> _logger;

    public LeetCodeStatsSyncService(
        YukiVerseDbContext db,
        LeetCodeClient client,
        IConfiguration config,
        ILogger<LeetCodeStatsSyncService> logger)
    {
        _db = db;
        _client = client;
        _username = config["LC_USERNAME"]
            ?? throw new InvalidOperationException("LC_USERNAME is not set in configuration.");
        _logger = logger;
    }

    public async Task<LeetCodeStatsResult> SyncAsync(CancellationToken ct = default)
    {
        var platform = await _db.Platforms
            .FirstAsync(p => p.Name == PlatformSlugs.LeetCode, ct);

        try
        {
            var matchedUser = await _client.GetUserStatsAsync(_username, ct);

            if (matchedUser?.SubmitStats is null)
                throw new InvalidOperationException(
                    $"LeetCode user '{_username}' not found or has no stats.");

            var counts = matchedUser.SubmitStats.AcSubmissionNum;

            int Get(string difficulty) =>
                counts.FirstOrDefault(c => c.Difficulty == difficulty)?.Count ?? 0;

            var total  = Get("All");
            var easy   = Get("Easy");
            var medium = Get("Medium");
            var hard   = Get("Hard");

            var existing = await _db.ProblemStats
                .FirstOrDefaultAsync(p => p.PlatformId == platform.Id, ct);

            if (existing is null)
            {
                _db.ProblemStats.Add(new ProblemStats
                {
                    PlatformId  = platform.Id,
                    TotalSolved  = total,
                    EasySolved   = easy,
                    MediumSolved = medium,
                    HardSolved   = hard,
                    UpdatedAt    = DateTime.UtcNow
                });
            }
            else
            {
                existing.TotalSolved  = total;
                existing.EasySolved   = easy;
                existing.MediumSolved = medium;
                existing.HardSolved   = hard;
                existing.UpdatedAt    = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);

            _db.SyncLogs.Add(new SyncLog
            {
                PlatformId  = platform.Id,
                LastSyncAt  = DateTime.UtcNow,
                Status      = SyncStatuses.Success
            });
            await _db.SaveChangesAsync(CancellationToken.None);

            _logger.LogInformation(
                "LeetCode stats sync complete: {Total} solved (Easy {Easy} / Medium {Medium} / Hard {Hard}).",
                total, easy, medium, hard);

            return new LeetCodeStatsResult(total, easy, medium, hard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LeetCode stats sync failed for user '{Username}'", _username);

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
}

/// <summary>Summary returned to the caller after a successful stats sync.</summary>
public record LeetCodeStatsResult(int TotalSolved, int EasySolved, int MediumSolved, int HardSolved);
