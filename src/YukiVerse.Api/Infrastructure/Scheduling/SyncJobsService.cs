using YukiVerse.Api.Services.AtCoderSync;
using YukiVerse.Api.Services.CodeforcesSync;
using YukiVerse.Api.Services.GitHubSync;
using YukiVerse.Api.Services.LeetCodeSync;

namespace YukiVerse.Api.Infrastructure.Scheduling;

/// <summary>
/// Hangfire job methods. Each method is a thin wrapper that delegates to the
/// corresponding sync service and swallows exceptions so a single failing job
/// does not block the Hangfire retry queue indefinitely.
/// Hangfire creates a new DI scope per job execution, so all injected services
/// are properly scoped.
/// </summary>
public class SyncJobsService
{
    private readonly CodeforcesSyncService _codeforces;
    private readonly GitHubSyncService _github;
    private readonly AtCoderSyncService _atcoder;
    private readonly LeetCodeStatsSyncService _lcStats;
    private readonly LeetCodeSubmissionSyncService _lcSubmissions;
    private readonly ILogger<SyncJobsService> _logger;

    public SyncJobsService(
        CodeforcesSyncService codeforces,
        GitHubSyncService github,
        AtCoderSyncService atcoder,
        LeetCodeStatsSyncService lcStats,
        LeetCodeSubmissionSyncService lcSubmissions,
        ILogger<SyncJobsService> logger)
    {
        _codeforces   = codeforces;
        _github       = github;
        _atcoder      = atcoder;
        _lcStats      = lcStats;
        _lcSubmissions = lcSubmissions;
        _logger       = logger;
    }

    public async Task SyncCodeforcesAsync()
    {
        _logger.LogInformation("[Scheduled] Starting Codeforces sync");
        try { await _codeforces.SyncAsync(); }
        catch (Exception ex) { _logger.LogError(ex, "[Scheduled] Codeforces sync failed"); }
    }

    public async Task SyncGitHubAsync()
    {
        _logger.LogInformation("[Scheduled] Starting GitHub sync");
        try { await _github.SyncAsync(); }
        catch (Exception ex) { _logger.LogError(ex, "[Scheduled] GitHub sync failed"); }
    }

    public async Task SyncAtCoderAsync()
    {
        _logger.LogInformation("[Scheduled] Starting AtCoder sync");
        try { await _atcoder.SyncAsync(); }
        catch (Exception ex) { _logger.LogError(ex, "[Scheduled] AtCoder sync failed"); }
    }

    /// <summary>
    /// Runs both LeetCode stats and submission syncs together so the problem
    /// counts and the activity feed stay in sync after a single scheduled run.
    /// </summary>
    public async Task SyncLeetCodeAsync()
    {
        _logger.LogInformation("[Scheduled] Starting LeetCode sync");
        try { await _lcStats.SyncAsync(); }
        catch (Exception ex) { _logger.LogError(ex, "[Scheduled] LeetCode stats sync failed"); }

        try { await _lcSubmissions.SyncAsync(); }
        catch (Exception ex) { _logger.LogError(ex, "[Scheduled] LeetCode submission sync failed"); }
    }
}
