using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YukiVerse.Api.Domain;

namespace YukiVerse.Api.Data.Configurations;

public class PlatformConfiguration : IEntityTypeConfiguration<Platform>
{
    // Fixed ids so the seed data stays stable across migrations and foreign keys are predictable.
    public const int CodeforcesId = 1;
    public const int AtCoderId = 2;
    public const int LeetCodeId = 3;
    public const int GitHubId = 4;

    public void Configure(EntityTypeBuilder<Platform> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(p => p.Name).IsUnique();

        builder.HasData(
            new Platform { Id = CodeforcesId, Name = PlatformSlugs.Codeforces },
            new Platform { Id = AtCoderId, Name = PlatformSlugs.AtCoder },
            new Platform { Id = LeetCodeId, Name = PlatformSlugs.LeetCode },
            new Platform { Id = GitHubId, Name = PlatformSlugs.GitHub });
    }
}
