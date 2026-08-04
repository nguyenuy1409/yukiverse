namespace YukiVerse.Api.Domain;

/// <summary>
/// Outcome of the most recent sync attempt for a platform. The frontend reads this to
/// render the "last updated X ago" indicator and to surface a stale state when a sync fails.
/// A failed row keeps the previous successful data untouched.
/// </summary>
public class SyncLog
{
    public int Id { get; set; }

    public int PlatformId { get; set; }
    public Platform? Platform { get; set; }

    public DateTime LastSyncAt { get; set; }

    /// <summary>See <see cref="SyncStatuses"/>.</summary>
    public string Status { get; set; } = string.Empty;

    public string? ErrorMessage { get; set; }
}
