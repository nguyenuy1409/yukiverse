using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YukiVerse.Api.Data;

namespace YukiVerse.Api.Controllers;

/// <summary>
/// Liveness endpoint used to confirm the API is up and the database is reachable.
/// Also reports how many platforms were seeded, which is the quickest way to verify
/// that migrations ran during the Step 0 skeleton bring-up.
/// </summary>
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly YukiVerseDbContext _db;

    public HealthController(YukiVerseDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        if (!await _db.Database.CanConnectAsync(cancellationToken))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unhealthy",
                database = "unreachable"
            });
        }

        var platformCount = await _db.Platforms.CountAsync(cancellationToken);

        return Ok(new
        {
            status = "healthy",
            database = "reachable",
            platforms = platformCount,
            timeUtc = DateTime.UtcNow
        });
    }
}
