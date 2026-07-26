using System.Text.Json.Serialization;

namespace YukiVerse.Api.Infrastructure.AtCoder;

/// <summary>
/// A single submission entry from the kenkoooo AtCoder Problems API.
/// The API uses snake_case JSON, deserialized via SnakeCaseLower naming policy.
/// </summary>
public class AcSubmission
{
    public long Id { get; set; }
    public long EpochSecond { get; set; }
    public string ProblemId { get; set; } = string.Empty;
    public string ContestId { get; set; } = string.Empty;

    /// <summary>Judge verdict, e.g. "AC", "WA", "TLE", "RE".</summary>
    public string Result { get; set; } = string.Empty;
}

/// <summary>
/// A single contest result from the AtCoder user history endpoint.
/// The endpoint returns PascalCase JSON.
/// </summary>
public class AcRatingChange
{
    public bool IsRated { get; set; }
    public int Place { get; set; }
    public int OldRating { get; set; }
    public int NewRating { get; set; }

    /// <summary>Short unique identifier for the contest, e.g. "abc001".</summary>
    public string ContestScreenName { get; set; } = string.Empty;

    /// <summary>Human-readable contest title in Japanese.</summary>
    public string ContestName { get; set; } = string.Empty;

    [JsonPropertyName("EndTime")]
    public DateTimeOffset EndTime { get; set; }
}
