using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YukiVerse.Api.Domain;

namespace YukiVerse.Api.Data.Configurations;

public class ProblemStatsConfiguration : IEntityTypeConfiguration<ProblemStats>
{
    public void Configure(EntityTypeBuilder<ProblemStats> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.TotalSolved).HasDefaultValue(0);

        builder.HasOne(s => s.Platform)
            .WithMany(p => p.ProblemStats)
            .HasForeignKey(s => s.PlatformId)
            .OnDelete(DeleteBehavior.Cascade);

        // A single current snapshot per platform.
        builder.HasIndex(s => s.PlatformId).IsUnique();
    }
}
