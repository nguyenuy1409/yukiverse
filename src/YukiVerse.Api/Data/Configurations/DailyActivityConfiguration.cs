using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YukiVerse.Api.Domain;

namespace YukiVerse.Api.Data.Configurations;

public class DailyActivityConfiguration : IEntityTypeConfiguration<DailyActivity>
{
    public void Configure(EntityTypeBuilder<DailyActivity> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Count).HasDefaultValue(0);

        builder.HasOne(a => a.Platform)
            .WithMany(p => p.DailyActivities)
            .HasForeignKey(a => a.PlatformId)
            .OnDelete(DeleteBehavior.Cascade);

        // The sync job upserts a single row per platform and day.
        builder.HasIndex(a => new { a.PlatformId, a.Date }).IsUnique();
    }
}
