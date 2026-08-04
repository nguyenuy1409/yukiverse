using Microsoft.AspNetCore.Mvc;
using YukiVerse.Api.Services.AtCoderSync;
using YukiVerse.Api.Services.CodeforcesSync;
using YukiVerse.Api.Services.GitHubSync;
using YukiVerse.Api.Services.LeetCodeSync;

namespace YukiVerse.Api.Controllers;

[ApiController]
[Route("api/sync")]
public class SyncController : ControllerBase
{
    private readonly CodeforcesSyncService _codeforcesSync;
    private readonly GitHubSyncService _githubSync;
    private readonly AtCoderSyncService _atcoderSync;
    private readonly LeetCodeStatsSyncService _leetcodeStatsSync;
    private readonly LeetCodeSubmissionSyncService _leetcodeSubmissionSync;
    private readonly ILogger<SyncController> _logger;

    public SyncController(
        CodeforcesSyncService codeforcesSync,
        GitHubSyncService githubSync,
        AtCoderSyncService atcoderSync,
        LeetCodeStatsSyncService leetcodeStatsSync,
        LeetCodeSubmissionSyncService leetcodeSubmissionSync,
        ILogger<SyncController> logger)
    {
        _codeforcesSync = codeforcesSync;
        _githubSync = githubSync;
        _atcoderSync = atcoderSync;
        _leetcodeStatsSync = leetcodeStatsSync;
        _leetcodeSubmissionSync = leetcodeSubmissionSync;
        _logger = logger;
    }

    /// <summary>
    /// Triggers a full Codeforces sync for the configured handle.
    /// New submissions and rating entries are appended; existing rows are not modified.
    /// </summary>
    [HttpPost("codeforces")]
    public async Task<IActionResult> SyncCodeforces(CancellationToken ct)
    {
        try
        {
            var result = await _codeforcesSync.SyncAsync(ct);
            return Ok(new
            {
                newSubmissions = result.NewSubmissions,
                newRatingEntries = result.NewRatingEntries,
                syncedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST /api/sync/codeforces failed");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Triggers an AtCoder sync for the configured handle.
    /// Submissions are sourced from kenkoooo.com; rating history from atcoder.jp.
    /// </summary>
    [HttpPost("atcoder")]
    public async Task<IActionResult> SyncAtCoder(CancellationToken ct)
    {
        try
        {
            var result = await _atcoderSync.SyncAsync(ct);
            return Ok(new
            {
                newSubmissions = result.NewSubmissions,
                newRatingEntries = result.NewRatingEntries,
                syncedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST /api/sync/atcoder failed");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Fetches aggregate LeetCode problem counts (total / easy / medium / hard)
    /// from the public GraphQL API. No session cookie required.
    /// </summary>
    [HttpPost("leetcode/stats")]
    public async Task<IActionResult> SyncLeetCodeStats(CancellationToken ct)
    {
        try
        {
            var result = await _leetcodeStatsSync.SyncAsync(ct);
            return Ok(new
            {
                totalSolved  = result.TotalSolved,
                easySolved   = result.EasySolved,
                mediumSolved = result.MediumSolved,
                hardSolved   = result.HardSolved,
                syncedAt     = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST /api/sync/leetcode/stats failed");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Fetches LeetCode submission history using the stored session cookie.
    /// Returns status "needs_refresh" (HTTP 200) when the cookie has expired
    /// so callers can surface a stale indicator without treating it as an error.
    /// </summary>
    [HttpPost("leetcode/submissions")]
    public async Task<IActionResult> SyncLeetCodeSubmissions(CancellationToken ct)
    {
        try
        {
            var result = await _leetcodeSubmissionSync.SyncAsync(ct);
            return Ok(new
            {
                newSubmissions = result.NewSubmissions,
                status         = result.Status,
                syncedAt       = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST /api/sync/leetcode/submissions failed");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Triggers a GitHub push-event sync for the configured user.
    /// Only the most recent 300 events are available from the GitHub API.
    /// </summary>
    [HttpPost("github")]
    public async Task<IActionResult> SyncGitHub(CancellationToken ct)
    {
        try
        {
            var result = await _githubSync.SyncAsync(ct);
            return Ok(new
            {
                newPushEvents = result.NewPushEvents,
                syncedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST /api/sync/github failed");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
