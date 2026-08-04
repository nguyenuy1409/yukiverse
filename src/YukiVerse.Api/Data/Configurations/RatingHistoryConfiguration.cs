using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YukiVerse.Api.Domain;

namespace YukiVerse.Api.Data.Configurations;

public class RatingHistoryConfiguration : IEntityTypeConfiguration<RatingHistory>
{
    public void Configure(EntityTypeBuilder<RatingHistory> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.ContestName).HasMaxLength(255);

        builder.HasOne(r => r.Platform)
            .WithMany(p => p.RatingHistory)
            .HasForeignKey(r => r.PlatformId)
            .OnDelete(DeleteBehavior.Cascade);

        // One data point per contest per platform; guards against re-inserting on repeated syncs.
        builder.HasIndex(r => new { r.PlatformId, r.ContestName }).IsUnique();

        builder.HasIndex(r => new { r.PlatformId, r.Date });
    }
}
