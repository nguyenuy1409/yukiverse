using System.Net.Http.Json;
using System.Text.Json;

namespace YukiVerse.Api.Infrastructure.GitHub;

/// <summary>
/// Thin HTTP wrapper around the GitHub REST API v3.
/// Fetches up to 300 public push events (3 pages x 100) for the configured user.
/// The GitHub API hard-caps event history at 300 entries regardless of token scope.
/// </summary>
public class GitHubClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GitHubClient> _logger;

    private const int PageSize = 100;
    private const int MaxPages = 3;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public GitHubClient(HttpClient httpClient, ILogger<GitHubClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Returns all PushEvent entries available for the user (up to 300).
    /// Stops early when a page returns fewer items than the requested page size.
    /// </summary>
    public async Task<List<GitHubEvent>> GetPushEventsAsync(string username, CancellationToken ct = default)
    {
        var result = new List<GitHubEvent>();

        for (var page = 1; page <= MaxPages; page++)
        {
            var url = $"https://api.github.com/users/{Uri.EscapeDataString(username)}/events?per_page={PageSize}&page={page}";
            _logger.LogInformation("Fetching GitHub events for '{Username}', page {Page}", username, page);

            var events = await _httpClient.GetFromJsonAsync<List<GitHubEvent>>(url, JsonOptions, ct);

            if (events is null || events.Count == 0)
                break;

            result.AddRange(events.Where(e => e.Type == "PushEvent"));

            if (events.Count < PageSize)
                break;
        }

        _logger.LogInformation("Fetched {Count} push events for '{Username}'", result.Count, username);
        return result;
    }
}
