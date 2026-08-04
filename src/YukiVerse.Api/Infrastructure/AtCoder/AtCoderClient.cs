using System.Net.Http.Json;
using System.Text.Json;

namespace YukiVerse.Api.Infrastructure.AtCoder;

/// <summary>
/// HTTP wrapper for two AtCoder data sources:
/// - kenkoooo.com (AtCoder Problems) for full submission history, paginated in
///   batches of 500 ordered by epoch_second ascending.
/// - atcoder.jp user history endpoint for rated contest results.
/// </summary>
public class AtCoderClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AtCoderClient> _logger;

    private const int PageSize = 500;
    private const int MaxPages = 40; // guard against infinite loops; covers 20 000 submissions

    private static readonly JsonSerializerOptions SnakeCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    private static readonly JsonSerializerOptions PascalCaseOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AtCoderClient(HttpClient httpClient, ILogger<AtCoderClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Returns all submissions for the given handle by paginating the kenkoooo API
    /// in ascending epoch_second order until a partial page is received.
    /// </summary>
    public async Task<List<AcSubmission>> GetSubmissionsAsync(string handle, CancellationToken ct = default)
    {
        var all = new List<AcSubmission>();
        long fromSecond = 0;

        for (var page = 1; page <= MaxPages; page++)
        {
            var url = $"https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user={Uri.EscapeDataString(handle)}&from_second={fromSecond}";
            _logger.LogInformation("Fetching AtCoder submissions for '{Handle}', page {Page} (from_second={From})", handle, page, fromSecond);

            var batch = await _httpClient.GetFromJsonAsync<List<AcSubmission>>(url, SnakeCaseOptions, ct);

            if (batch is null || batch.Count == 0)
                break;

            all.AddRange(batch);

            if (batch.Count < PageSize)
                break;

            // Advance cursor past the last item's timestamp. If multiple items share
            // the same second, they will be caught by the external_id dedup in the service.
            fromSecond = batch[^1].EpochSecond + 1;
        }

        _logger.LogInformation("Fetched {Count} total submissions for '{Handle}'", all.Count, handle);
        return all;
    }

    /// <summary>
    /// Returns the full rated-contest history for the given handle from the
    /// AtCoder user history endpoint.
    /// </summary>
    public async Task<List<AcRatingChange>> GetRatingHistoryAsync(string handle, CancellationToken ct = default)
    {
        var url = $"https://atcoder.jp/users/{Uri.EscapeDataString(handle)}/history/json";
        _logger.LogInformation("Fetching AtCoder rating history for '{Handle}'", handle);

        var result = await _httpClient.GetFromJsonAsync<List<AcRatingChange>>(url, PascalCaseOptions, ct);
        return result ?? new List<AcRatingChange>();
    }
}
