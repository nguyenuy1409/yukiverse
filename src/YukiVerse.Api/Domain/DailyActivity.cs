namespace YukiVerse.Api.Domain;

/// <summary>
/// Number of tracked events (submissions or commits) for a single platform on a single day.
/// One row per (platform, day); the sync job upserts on that pair.
/// </summary>
public class DailyActivity
{
    public int Id { get; set; }

    public int PlatformId { get; set; }
    public Platform? Platform { get; set; }

    public DateOnly Date { get; set; }

    public int Count { get; set; }

    public DateTime UpdatedAt { get; set; }
}
