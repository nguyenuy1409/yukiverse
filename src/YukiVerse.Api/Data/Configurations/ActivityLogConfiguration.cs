using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YukiVerse.Api.Domain;

namespace YukiVerse.Api.Data.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Type).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Title).HasMaxLength(255).IsRequired();
        builder.Property(a => a.Verdict).HasMaxLength(50);
        builder.Property(a => a.ExternalId).HasMaxLength(100);

        builder.HasOne(a => a.Platform)
            .WithMany(p => p.ActivityLogs)
            .HasForeignKey(a => a.PlatformId)
            .OnDelete(DeleteBehavior.Cascade);

        // Dedup key: an external id is unique within a platform. Filtered so rows without an
        // external id are still allowed, while real ids can never be inserted twice.
        builder.HasIndex(a => new { a.PlatformId, a.ExternalId })
            .IsUnique()
            .HasFilter("\"external_id\" IS NOT NULL");

        // The feed reads newest first.
        builder.HasIndex(a => a.OccurredAt);
    }
}
