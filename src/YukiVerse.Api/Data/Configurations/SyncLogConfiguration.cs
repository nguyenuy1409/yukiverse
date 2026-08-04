using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YukiVerse.Api.Domain;

namespace YukiVerse.Api.Data.Configurations;

public class SyncLogConfiguration : IEntityTypeConfiguration<SyncLog>
{
    public void Configure(EntityTypeBuilder<SyncLog> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Status).HasMaxLength(50).IsRequired();

        builder.HasOne(s => s.Platform)
            .WithMany(p => p.SyncLogs)
            .HasForeignKey(s => s.PlatformId)
            .OnDelete(DeleteBehavior.Cascade);

        // Looking up the most recent attempt per platform is the common read path.
        builder.HasIndex(s => new { s.PlatformId, s.LastSyncAt });
    }
}
