namespace YukiVerse.Api.Infrastructure.LeetCode;

/// <summary>A generic GraphQL request body.</summary>
public class LcGraphQlRequest
{
    public string Query { get; set; } = string.Empty;
    public object? Variables { get; set; }
}

/// <summary>Top-level GraphQL response wrapper.</summary>
public class LcGraphQlResponse<T>
{
    public T? Data { get; set; }
}

/// <summary>Root data node for the user profile query.</summary>
public class LcUserProfileData
{
    public LcMatchedUser? MatchedUser { get; set; }
}

public class LcMatchedUser
{
    public LcSubmitStats? SubmitStats { get; set; }
}

public class LcSubmitStats
{
    /// <summary>
    /// Accepted submission counts broken down by difficulty.
    /// Entries use difficulty values "All", "Easy", "Medium", "Hard".
    /// </summary>
    public List<LcDifficultyCount> AcSubmissionNum { get; set; } = new();
}

public class LcDifficultyCount
{
    public string Difficulty { get; set; } = string.Empty;

    /// <summary>Number of distinct problems accepted at this difficulty.</summary>
    public int Count { get; set; }
}

// ---------------------------------------------------------------------------
// Submission history (requires LEETCODE_SESSION cookie)
// ---------------------------------------------------------------------------

/// <summary>Root data node for the authenticated submission list query.</summary>
public class LcSubmissionListData
{
    public LcSubmissionList? SubmissionList { get; set; }
}

public class LcSubmissionList
{
    public bool HasNext { get; set; }
    public List<LcSubmission> Submissions { get; set; } = new();
}

public class LcSubmission
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;

    /// <summary>Human-readable verdict from the judge, e.g. "Accepted", "Wrong Answer".</summary>
    public string StatusDisplay { get; set; } = string.Empty;

    /// <summary>Unix epoch seconds as a string.</summary>
    public string Timestamp { get; set; } = string.Empty;
}
