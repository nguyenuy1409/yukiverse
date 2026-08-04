namespace YukiVerse.Api.Domain;

/// <summary>
/// Canonical platform slugs. These are the seeded <see cref="Platform.Name"/> values
/// and the identifiers the API accepts in query strings, so keep them lowercase and stable.
/// </summary>
public static class PlatformSlugs
{
    public const string Codeforces = "codeforces";
    public const string AtCoder = "atcoder";
    public const string LeetCode = "leetcode";
    public const string GitHub = "github";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Codeforces,
        AtCoder,
        LeetCode,
        GitHub
    };
}
