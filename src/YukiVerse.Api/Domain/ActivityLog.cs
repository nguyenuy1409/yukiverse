namespace YukiVerse.Api.Domain;

/// <summary>
/// A single activity item shown in the feed: a judge submission (with a verdict)
/// or a GitHub push. <see cref="ExternalId"/> is the platform's own id for the item
/// and is used to deduplicate across repeated syncs.
/// </summary>
public class ActivityLog
{
    public int Id { get; set; }

    public int PlatformId { get; set; }
    public Platform? Platform { get; set; }

    /// <summary>See <see cref="ActivityTypes"/>.</summary>
    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    /// <summary>Judge verdict such as AC, WA or TLE. Null for commits.</summary>
    public string? Verdict { get; set; }

    /// <summary>Submission id or commit sha. Used as the dedup key together with the platform.</summary>
    public string? ExternalId { get; set; }

    public DateTime OccurredAt { get; set; }
}
