using System.Net.Http.Json;
using System.Text.Json;

namespace YukiVerse.Api.Infrastructure.Codeforces;

/// <summary>
/// Thin HTTP wrapper around the public Codeforces REST API.
/// Registered as a typed HttpClient so the framework manages connection pooling.
/// </summary>
public class CodeforcesClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CodeforcesClient> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public CodeforcesClient(HttpClient httpClient, ILogger<CodeforcesClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Returns up to 10 000 most recent submissions for the given handle, newest first.
    /// </summary>
    public async Task<List<CfSubmission>> GetSubmissionsAsync(string handle, CancellationToken ct = default)
    {
        var url = $"https://codeforces.com/api/user.status?handle={Uri.EscapeDataString(handle)}&from=1&count=10000";
        _logger.LogInformation("Fetching Codeforces submissions for handle '{Handle}'", handle);

        var response = await _httpClient.GetFromJsonAsync<CfApiResponse<List<CfSubmission>>>(url, JsonOptions, ct);
        EnsureOk(response);
        return response!.Result!;
    }

    /// <summary>
    /// Returns the full rated-contest history for the given handle, oldest first.
    /// </summary>
    public async Task<List<CfRatingChange>> GetRatingHistoryAsync(string handle, CancellationToken ct = default)
    {
        var url = $"https://codeforces.com/api/user.rating?handle={Uri.EscapeDataString(handle)}";
        _logger.LogInformation("Fetching Codeforces rating history for handle '{Handle}'", handle);

        var response = await _httpClient.GetFromJsonAsync<CfApiResponse<List<CfRatingChange>>>(url, JsonOptions, ct);
        EnsureOk(response);
        return response!.Result!;
    }

    private static void EnsureOk<T>(CfApiResponse<T>? response)
    {
        if (response is null)
            throw new InvalidOperationException("Codeforces API returned an empty response.");

        if (response.Status != "OK" || response.Result is null)
            throw new InvalidOperationException(
                $"Codeforces API error: {response.Comment ?? "unknown error"}");
    }
}
