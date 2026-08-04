namespace YukiVerse.Api.Domain;

/// <summary>Allowed values for <see cref="SyncLog.Status"/>.</summary>
public static class SyncStatuses
{
    public const string Success = "success";
    public const string Failed = "failed";

    /// <summary>
    /// The sync ran but the stored session cookie has expired.
    /// Existing data is preserved; the user must update LC_SESSION_COOKIE to resume syncing.
    /// </summary>
    public const string NeedsRefresh = "needs_refresh";
}
