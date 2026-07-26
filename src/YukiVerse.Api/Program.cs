using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using YukiVerse.Api.Data;
using YukiVerse.Api.Infrastructure;
using YukiVerse.Api.Infrastructure.AtCoder;
using YukiVerse.Api.Infrastructure.Codeforces;
using YukiVerse.Api.Infrastructure.GitHub;
using YukiVerse.Api.Infrastructure.LeetCode;
using YukiVerse.Api.Infrastructure.Scheduling;
using YukiVerse.Api.Services.AtCoderSync;
using YukiVerse.Api.Services.CodeforcesSync;
using YukiVerse.Api.Services.GitHubSync;
using YukiVerse.Api.Services.LeetCodeSync;

// Load variables from a local .env when present. On a managed host the variables are
// injected directly, so there is nothing to find and this is a no-op.
DotEnvLoader.Load();

var builder = WebApplication.CreateBuilder(args);

var databaseUrl = builder.Configuration["DATABASE_URL"];
var connectionString = DatabaseUrlParser.ToNpgsqlConnectionString(databaseUrl);

builder.Services.AddDbContext<YukiVerseDbContext>(options =>
    options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());

builder.Services.AddHttpClient<CodeforcesClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "YukiVerse/1.0");
});
builder.Services.AddScoped<CodeforcesSyncService>();

var githubToken = builder.Configuration["GITHUB_TOKEN"] ?? string.Empty;
builder.Services.AddHttpClient<GitHubClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "YukiVerse/1.0");
    client.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");
    if (!string.IsNullOrEmpty(githubToken))
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {githubToken}");
});
builder.Services.AddScoped<GitHubSyncService>();

builder.Services.AddHttpClient<AtCoderClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(60); // kenkoooo can be slow
    client.DefaultRequestHeaders.Add("User-Agent", "YukiVerse/1.0");
});
builder.Services.AddScoped<AtCoderSyncService>();

builder.Services.AddHttpClient<LeetCodeClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "YukiVerse/1.0");
    client.DefaultRequestHeaders.Add("Referer", "https://leetcode.com");
});
builder.Services.AddScoped<LeetCodeStatsSyncService>();
builder.Services.AddScoped<LeetCodeSubmissionSyncService>();

// Hangfire — uses the same Postgres database, stored in the "hangfire" schema.
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString),
        new PostgreSqlStorageOptions { SchemaName = "hangfire" }));

builder.Services.AddHangfireServer();
builder.Services.AddScoped<SyncJobsService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: in production set CORS_ORIGINS to the frontend URL, e.g.
//   CORS_ORIGINS=https://yukiverse.vercel.app
// Multiple origins can be comma-separated.
var corsOrigins = (builder.Configuration["CORS_ORIGINS"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

// Auto-apply EF migrations on startup so Railway/Render databases are always up to date.
// Migrations are idempotent, so this is safe to run every boot.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider
         .GetRequiredService<YukiVerseDbContext>()
         .Database.Migrate();
}

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Hangfire dashboard — accessible at /hangfire.
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    // Allow access without authentication in development.
    // Lock this down before deploying to a public host.
    Authorization = new[] { new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter() }
});

// Register recurring jobs. Intervals are driven by SYNC_INTERVAL_HOURS (.env).
var syncHours = int.TryParse(app.Configuration["SYNC_INTERVAL_HOURS"], out var h) ? h : 6;
var statsCron  = $"0 */{syncHours} * * *"; // e.g. every 6 hours
var githubCron = "0 * * * *";              // every 1 hour (fixed per spec)

RecurringJob.AddOrUpdate<SyncJobsService>("sync-codeforces",
    x => x.SyncCodeforcesAsync(), statsCron);

RecurringJob.AddOrUpdate<SyncJobsService>("sync-atcoder",
    x => x.SyncAtCoderAsync(), statsCron);

RecurringJob.AddOrUpdate<SyncJobsService>("sync-leetcode",
    x => x.SyncLeetCodeAsync(), statsCron);

RecurringJob.AddOrUpdate<SyncJobsService>("sync-github",
    x => x.SyncGitHubAsync(), githubCron);

app.UseAuthorization();
app.MapControllers();

app.Run();