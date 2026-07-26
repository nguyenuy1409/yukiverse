using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YukiVerse.Api.Data;
using YukiVerse.Api.Domain;

namespace YukiVerse.Api.Controllers;

/// <summary>
/// Read-only endpoints consumed by the frontend to render charts and cards.
/// All data is sourced from pre-aggregated tables (daily_activities, problem_stats,
/// rating_history) or from activity_logs with a bounded limit.
/// </summary>
[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly YukiVerseDbContext _db;

    public StatsController(YukiVerseDbContext db)
    {
        _db = db;
    }

    // -------------------------------------------------------------------------
    // GET /api/stats/heatmap?days=365
    // Returns total activity count per day across all platforms, for the
    // GitHub-style contribution heatmap.
    // -------------------------------------------------------------------------
    [HttpGet("heatmap")]
    public async Task<IActionResult> Heatmap([FromQuery] int days = 365, CancellationToken ct = default)
    {
        var from = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));

        var data = await _db.DailyActivities
            .Where(d => d.Date >= from)
            .GroupBy(d => d.Date)
            .Select(g => new
            {
                date  = g.Key,
                count = g.Sum(d => d.Count)
            })
            .OrderBy(x => x.date)
            .ToListAsync(ct);

        return Ok(new { days = data });
    }

    // -------------------------------------------------------------------------
    // GET /api/stats/daily?days=90
    // Returns per-platform daily activity counts for the stacked bar chart.
    // -------------------------------------------------------------------------
    [HttpGet("daily")]
    public async Task<IActionResult> Daily([FromQuery] int days = 90, CancellationToken ct = default)
    {
        var from = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));

        var platformMap = await GetPlatformMapAsync(ct);

        var rows = await _db.DailyActivities
            .Where(d => d.Date >= from)
            .ToListAsync(ct);

        var grouped = rows
            .GroupBy(d => d.Date)
            .Select(g => new
            {
                date       = g.Key,
                codeforces = g.FirstOrDefault(d => d.PlatformId == platformMap[PlatformSlugs.Codeforces])?.Count ?? 0,
                atcoder    = g.FirstOrDefault(d => d.PlatformId == platformMap[PlatformSlugs.AtCoder])?.Count ?? 0,
                leetcode   = g.FirstOrDefault(d => d.PlatformId == platformMap[PlatformSlugs.LeetCode])?.Count ?? 0,
                github     = g.FirstOrDefault(d => d.PlatformId == platformMap[PlatformSlugs.GitHub])?.Count ?? 0,
            })
            .OrderBy(x => x.date)
            .ToList();

        return Ok(new { days = grouped });
    }

    // -------------------------------------------------------------------------
    // GET /api/stats/cumulative
    // Returns running totals of submissions over all time, broken down by
    // platform. Used for the cumulative activity chart.
    // -------------------------------------------------------------------------
    [HttpGet("cumulative")]
    public async Task<IActionResult> Cumulative(CancellationToken ct = default)
    {
        var platformMap = await GetPlatformMapAsync(ct);

        var rows = await _db.DailyActivities.ToListAsync(ct);

        var byDate = rows
            .GroupBy(d => d.Date)
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                date       = g.Key,
                codeforces = g.FirstOrDefault(d => d.PlatformId == platformMap[PlatformSlugs.Codeforces])?.Count ?? 0,
                atcoder    = g.FirstOrDefault(d => d.PlatformId == platformMap[PlatformSlugs.AtCoder])?.Count ?? 0,
                leetcode   = g.FirstOrDefault(d => d.PlatformId == platformMap[PlatformSlugs.LeetCode])?.Count ?? 0,
                github     = g.FirstOrDefault(d => d.PlatformId == platformMap[PlatformSlugs.GitHub])?.Count ?? 0,
            })
            .ToList();

        // Build running totals in a single pass.
        int cf = 0, ac = 0, lc = 0, gh = 0;
        var cumulative = byDate.Select(d =>
        {
            cf += d.codeforces; ac += d.atcoder; lc += d.leetcode; gh += d.github;
            return new
            {
                date       = d.date,
                total      = cf + ac + lc + gh,
                codeforces = cf,
                atcoder    = ac,
                leetcode   = lc,
                github     = gh,
            };
        }).ToList();

        return Ok(new { days = cumulative });
    }

    // -------------------------------------------------------------------------
    // GET /api/stats/rating
    // Returns rating history for contest platforms (Codeforces and AtCoder).
    // -------------------------------------------------------------------------
    [HttpGet("rating")]
    public async Task<IActionResult> Rating(CancellationToken ct = default)
    {
        var platformMap = await GetPlatformMapAsync(ct);

        var cfId = platformMap[PlatformSlugs.Codeforces];
        var acId = platformMap[PlatformSlugs.AtCoder];

        var all = await _db.RatingHistory
            .Where(r => r.PlatformId == cfId || r.PlatformId == acId)
            .OrderBy(r => r.Date)
            .ToListAsync(ct);

        static object Map(RatingHistory r) => new
        {
            date        = r.Date,
            rating      = r.Rating,
            rank        = r.Rank,
            contestName = r.ContestName
        };

        return Ok(new
        {
            codeforces = all.Where(r => r.PlatformId == cfId).Select(Map),
            atcoder    = all.Where(r => r.PlatformId == acId).Select(Map),
        });
    }

    // -------------------------------------------------------------------------
    // GET /api/stats/problems
    // Returns solved problem counts per platform for the stats cards.
    // GitHub has no problem_stats rows; its entry is synthesized from
    // daily_activities so the card shows total push events instead.
    // -------------------------------------------------------------------------
    [HttpGet("problems")]
    public async Task<IActionResult> Problems(CancellationToken ct = default)
    {
        var rows = await _db.ProblemStats
            .Join(_db.Platforms,
                ps => ps.PlatformId,
                p  => p.Id,
                (ps, p) => new PlatformStatsDto(
                    p.Name,
                    ps.TotalSolved,
                    ps.EasySolved   ?? 0,
                    ps.MediumSolved ?? 0,
                    ps.HardSolved   ?? 0,
                    ps.UpdatedAt,
                    null))
            .ToListAsync(ct);

        // Append GitHub: sum push events from daily_activities
        var platformMap = await GetPlatformMapAsync(ct);
        if (platformMap.TryGetValue(PlatformSlugs.GitHub, out var ghId))
        {
            var ghTotal = await _db.DailyActivities
                .Where(d => d.PlatformId == ghId)
                .SumAsync(d => (int?)d.Count, ct) ?? 0;

            var ghUpdated = await _db.SyncLogs
                .Where(s => s.PlatformId == ghId)
                .OrderByDescending(s => s.LastSyncAt)
                .Select(s => (DateTime?)s.LastSyncAt)
                .FirstOrDefaultAsync(ct);

            rows.Add(new PlatformStatsDto(
                PlatformSlugs.GitHub,
                ghTotal,
                0, 0, 0,
                ghUpdated ?? DateTime.UtcNow,
                "push events"));
        }

        return Ok(new { platforms = rows });
    }

    /// <summary>
    /// Projection DTO shared by the Problems endpoint.
    /// The optional <c>statLabel</c> overrides the default "submissions tracked"
    /// label shown in the frontend card (e.g. "push events" for GitHub).
    /// </summary>
    private record PlatformStatsDto(
        string   platform,
        int      totalSolved,
        int      easySolved,
        int      mediumSolved,
        int      hardSolved,
        DateTime updatedAt,
        string?  statLabel);

    // -------------------------------------------------------------------------
    // GET /api/stats/feed?limit=20&platform=all
    // Returns the most recent activity log entries for the activity feed.
    // -------------------------------------------------------------------------
    [HttpGet("feed")]
    public async Task<IActionResult> Feed(
        [FromQuery] int limit = 20,
        [FromQuery] string? platform = null,
        CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 100);

        var query = _db.ActivityLogs
            .Join(_db.Platforms,
                a => a.PlatformId,
                p => p.Id,
                (a, p) => new { a, platformName = p.Name });

        if (!string.IsNullOrWhiteSpace(platform) &&
            platform != "all" &&
            PlatformSlugs.All.Contains(platform))
        {
            query = query.Where(x => x.platformName == platform);
        }

        var items = await query
            .OrderByDescending(x => x.a.OccurredAt)
            .Take(limit)
            .Select(x => new
            {
                platform   = x.platformName,
                type       = x.a.Type,
                title      = x.a.Title,
                verdict    = x.a.Verdict,
                occurredAt = x.a.OccurredAt,
            })
            .ToListAsync(ct);

        return Ok(new { items });
    }

    // -------------------------------------------------------------------------
    // GET /api/stats/sync-status
    // Returns the most recent sync log entry per platform.
    // -------------------------------------------------------------------------
    [HttpGet("sync-status")]
    public async Task<IActionResult> SyncStatus(CancellationToken ct = default)
    {
        var platforms = await _db.Platforms.ToListAsync(ct);

        var statuses = new List<object>();

        foreach (var p in platforms.OrderBy(p => p.Id))
        {
            var latest = await _db.SyncLogs
                .Where(s => s.PlatformId == p.Id)
                .OrderByDescending(s => s.LastSyncAt)
                .FirstOrDefaultAsync(ct);

            statuses.Add(new
            {
                platform     = p.Name,
                lastSyncAt   = latest?.LastSyncAt,
                status       = latest?.Status ?? "never",
                errorMessage = latest?.ErrorMessage,
            });
        }

        return Ok(new { platforms = statuses });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Loads a slug -> id map for all platforms. Used to avoid hardcoding IDs
    /// throughout the action methods.
    /// </summary>
    private async Task<Dictionary<string, int>> GetPlatformMapAsync(CancellationToken ct) =>
        await _db.Platforms.ToDictionaryAsync(p => p.Name, p => p.Id, ct);
}
