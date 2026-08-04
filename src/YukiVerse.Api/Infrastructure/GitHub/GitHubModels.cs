using System.Text.Json.Serialization;

namespace YukiVerse.Api.Infrastructure.GitHub;

/// <summary>
/// A single entry from the GitHub Events API. Only <c>PushEvent</c> entries
/// are processed; all other event types are ignored.
/// </summary>
public class GitHubEvent
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public GitHubRepo Repo { get; set; } = null!;
    public GitHubPushPayload? Payload { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
}

/// <summary>Repository info embedded in each event.</summary>
public class GitHubRepo
{
    /// <summary>Full name in "owner/repo" format, e.g. "nguyenuy1409/yukiverse".</summary>
    public string Name { get; set; } = string.Empty;
}

/// <summary>Payload for <c>PushEvent</c> entries.</summary>
public class GitHubPushPayload
{
    public List<GitHubCommit> Commits { get; set; } = new();
}

/// <summary>A single commit inside a push payload.</summary>
public class GitHubCommit
{
    public string Sha { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
