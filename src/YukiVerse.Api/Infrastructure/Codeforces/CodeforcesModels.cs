namespace YukiVerse.Api.Infrastructure.Codeforces;

/// <summary>
/// Wraps every Codeforces API response. The top-level <c>status</c> field is either
/// "OK" or "FAILED"; when failed, <c>comment</c> carries the error description.
/// </summary>
public class CfApiResponse<T>
{
    public string Status { get; set; } = string.Empty;
    public T? Result { get; set; }
    public string? Comment { get; set; }
}

/// <summary>A single submission from <c>user.status</c>.</summary>
public class CfSubmission
{
    public long Id { get; set; }
    public int? ContestId { get; set; }
    public CfProblem Problem { get; set; } = null!;

    /// <summary>
    /// Verdict string from the judge, e.g. "OK", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED".
    /// Null when the submission is still in the queue.
    /// </summary>
    public string? Verdict { get; set; }

    public long CreationTimeSeconds { get; set; }
}

/// <summary>Problem metadata embedded inside a <see cref="CfSubmission"/>.</summary>
public class CfProblem
{
    public int? ContestId { get; set; }
    public string Index { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

/// <summary>A single row from <c>user.rating</c> representing one rated contest result.</summary>
public class CfRatingChange
{
    public int ContestId { get; set; }
    public string ContestName { get; set; } = string.Empty;
    public int Rank { get; set; }
    public long RatingUpdateTimeSeconds { get; set; }
    public int OldRating { get; set; }
    public int NewRating { get; set; }
}
