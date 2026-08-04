using Npgsql;

namespace YukiVerse.Api.Infrastructure;

/// <summary>
/// Turns the single <c>DATABASE_URL</c> value into an Npgsql connection string.
/// Managed hosts (Railway, Render, Supabase) expose the database as a URI such as
/// <c>postgresql://user:pass@host:5432/dbname?sslmode=require</c>, while a plain
/// keyword connection string is passed through unchanged so local setups keep working.
/// </summary>
public static class DatabaseUrlParser
{
    public static string ToNpgsqlConnectionString(string? databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl))
        {
            throw new InvalidOperationException(
                "DATABASE_URL is not set. Copy .env.example to .env and fill it in, " +
                "or provide the variable in the hosting environment.");
        }

        // Not a URI, so assume it is already a Host=...;Port=... connection string.
        if (!databaseUrl.Contains("://", StringComparison.Ordinal))
        {
            return databaseUrl;
        }

        var uri = new Uri(databaseUrl);
        var credentials = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = credentials.Length > 1 ? Uri.UnescapeDataString(credentials[1]) : string.Empty,
            Database = uri.AbsolutePath.TrimStart('/')
        };

        ApplyQueryParameters(builder, uri.Query);

        return builder.ConnectionString;
    }

    private static void ApplyQueryParameters(NpgsqlConnectionStringBuilder builder, string query)
    {
        foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            var key = Uri.UnescapeDataString(parts[0]);
            var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty;

            if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase)
                && Enum.TryParse<SslMode>(value, ignoreCase: true, out var sslMode))
            {
                builder.SslMode = sslMode;
            }
        }
    }
}
