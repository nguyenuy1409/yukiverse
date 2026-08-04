namespace YukiVerse.Api.Domain;

/// <summary>
/// Latest solved-count snapshot for a platform. Kept as a single row per platform
/// that the sync job overwrites, since only the current totals are shown on the cards.
/// The difficulty breakdown is LeetCode specific and stays null elsewhere.
/// </summary>
public class ProblemStats
{
    public int Id { get; set; }

    public int PlatformId { get; set; }
    public Platform? Platform { get; set; }

    public int TotalSolved { get; set; }

    public int? EasySolved { get; set; }
    public int? MediumSolved { get; set; }
    public int? HardSolved { get; set; }

    public DateTime UpdatedAt { get; set; }
}
