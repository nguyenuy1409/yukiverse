namespace YukiVerse.Api.Domain;

/// <summary>
/// A single contest result used to plot rating over time. GitHub has no rating,
/// so only the contest platforms populate this table.
/// </summary>
public class RatingHistory
{
    public int Id { get; set; }

    public int PlatformId { get; set; }
    public Platform? Platform { get; set; }

    public string? ContestName { get; set; }

    public int Rating { get; set; }

    public int? Rank { get; set; }

    /// <summary>When the contest took place.</summary>
    public DateTime Date { get; set; }
}
