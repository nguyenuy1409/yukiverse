namespace YukiVerse.Api.Domain;

/// <summary>
/// A coding platform that YukiVerse tracks (Codeforces, AtCoder, LeetCode, GitHub).
/// Acts as a lookup table; rows are seeded on migration and never created at runtime.
/// </summary>
public class Platform
{
    public int Id { get; set; }

    /// <summary>
    /// Stable slug used throughout the codebase. See <see cref="PlatformSlugs"/>.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    public ICollection<DailyActivity> DailyActivities { get; set; } = new List<DailyActivity>();
    public ICollection<RatingHistory> RatingHistory { get; set; } = new List<RatingHistory>();
    public ICollection<ProblemStats> ProblemStats { get; set; } = new List<ProblemStats>();
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    public ICollection<SyncLog> SyncLogs { get; set; } = new List<SyncLog>();
}
