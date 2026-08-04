using System.Net.Http.Json;
using System.Text.Json;

namespace YukiVerse.Api.Infrastructure.LeetCode;

/// <summary>
/// HTTP wrapper for the LeetCode GraphQL API.
/// Aggregate stats (problem counts by difficulty) are publicly accessible without auth.
/// </summary>
public class LeetCodeClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LeetCodeClient> _logger;

    private const string GraphQlEndpoint = "https://leetcode.com/graphql";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private const int SubmissionPageSize = 20;
    private const int SubmissionMaxPages = 50; // guard; covers 1 000 submissions

    // Query for public aggregate stats — no session cookie required.
    private const string UserStatsQuery = """
        query getUserStats($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
        """;

    // Query for paginated submission history — requires LEETCODE_SESSION cookie.
    private const string SubmissionListQuery = """
        query submissionList($offset: Int!, $limit: Int!) {
          submissionList(offset: $offset, limit: $limit) {
            hasNext
            submissions {
              id
              title
              statusDisplay
              timestamp
            }
          }
        }
        """;

    public LeetCodeClient(HttpClient httpClient, ILogger<LeetCodeClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Fetches the accepted submission counts per difficulty for the given username.
    /// Returns null when the user profile is not found.
    /// </summary>
    public async Task<LcMatchedUser?> GetUserStatsAsync(string username, CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching LeetCode stats for user '{Username}'", username);

        var request = new LcGraphQlRequest
        {
            Query = UserStatsQuery,
            Variables = new { username }
        };

        var response = await _httpClient.PostAsJsonAsync(GraphQlEndpoint, request, JsonOptions, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content
            .ReadFromJsonAsync<LcGraphQlResponse<LcUserProfileData>>(JsonOptions, ct);

        return result?.Data?.MatchedUser;
    }

    /// <summary>
    /// Fetches all available submissions using the provided session cookie.
    /// Returns null when the cookie is expired or invalid so the caller can
    /// record a needs_refresh status without crashing.
    /// </summary>
    public async Task<List<LcSubmission>?> GetAllSubmissionsAsync(
        string sessionCookie, CancellationToken ct = default)
    {
        var all = new List<LcSubmission>();

        for (var page = 0; page < SubmissionMaxPages; page++)
        {
            var offset = page * SubmissionPageSize;
            _logger.LogInformation("Fetching LeetCode submissions page {Page} (offset={Offset})", page + 1, offset);

            var requestBody = new LcGraphQlRequest
            {
                Query = SubmissionListQuery,
                Variables = new { offset, limit = SubmissionPageSize }
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, GraphQlEndpoint);
            httpRequest.Headers.Add("Cookie", $"LEETCODE_SESSION={sessionCookie}");
            httpRequest.Content = JsonContent.Create(requestBody, options: JsonOptions);

            var httpResponse = await _httpClient.SendAsync(httpRequest, ct);
            httpResponse.EnsureSuccessStatusCode();

            var parsed = await httpResponse.Content
                .ReadFromJsonAsync<LcGraphQlResponse<LcSubmissionListData>>(JsonOptions, ct);

            // A null submissionList is the signal that the session has expired.
            if (parsed?.Data?.SubmissionList is null)
                return null;

            var page_data = parsed.Data.SubmissionList;
            all.AddRange(page_data.Submissions);

            if (!page_data.HasNext)
                break;
        }

        _logger.LogInformation("Fetched {Count} total submissions from LeetCode", all.Count);
        return all;
    }
}
