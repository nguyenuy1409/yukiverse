using Microsoft.EntityFrameworkCore;
using YukiVerse.Api.Domain;

namespace YukiVerse.Api.Data;

/// <summary>
/// EF Core context for the whole application. Mapping details live in the per-entity
/// configuration classes under <c>Data/Configurations</c> and are picked up automatically.
/// </summary>
public class YukiVerseDbContext : DbContext
{
    public YukiVerseDbContext(DbContextOptions<YukiVerseDbContext> options)
        : base(options)
    {
    }

    public DbSet<Platform> Platforms => Set<Platform>();
    public DbSet<DailyActivity> DailyActivities => Set<DailyActivity>();
    public DbSet<RatingHistory> RatingHistory => Set<RatingHistory>();
    public DbSet<ProblemStats> ProblemStats => Set<ProblemStats>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<SyncLog> SyncLogs => Set<SyncLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(YukiVerseDbContext).Assembly);
    }
}
