# YukiVerse

A personal portfolio dashboard that aggregates my competitive programming and coding
activity from Codeforces, AtCoder, LeetCode and GitHub into one place.

External APIs are never called from the browser. A scheduled backend job pulls each
platform on its own cadence, stores the results in PostgreSQL, and the frontend reads
only from this project's own API.

## Tech stack

- ASP.NET Core Web API (.NET 8)
- Entity Framework Core with Npgsql (PostgreSQL)
- React + Recharts (frontend, added in Phase 2)
- Hangfire for scheduled background sync (added in Step 6)

## Repository layout

```
YukiVerse.sln
docker-compose.yml            Local PostgreSQL for development
.env.example                  Template for local configuration
src/
  YukiVerse.Api/
    Program.cs                Application entry point and DI wiring
    Controllers/              HTTP endpoints
    Domain/                   Entities and shared constants
    Data/                     DbContext and EF Core configurations
    Infrastructure/           Cross cutting helpers (DATABASE_URL parsing, ...)
```

## Prerequisites

- .NET 8 SDK
- Docker (used to run PostgreSQL locally; installing Postgres directly works too)
- EF Core CLI tools: `dotnet tool install --global dotnet-ef`

## Getting started

1. Copy the environment template and adjust it if needed. The default `DATABASE_URL`
   already points at the Docker database below.

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL.

   ```bash
   docker compose up -d
   ```

3. Create the initial migration, then apply it. The migration files are generated from
   the entities and should be committed once created.

   ```bash
   dotnet ef migrations add InitialCreate --project src/YukiVerse.Api
   dotnet ef database update --project src/YukiVerse.Api
   ```

4. Run the API from the repository root so the `.env` file is picked up.

   ```bash
   dotnet run --project src/YukiVerse.Api
   ```

5. Open Swagger at `http://localhost:5080/swagger` or check the health endpoint:

   ```bash
   curl http://localhost:5080/api/health
   ```

   A healthy response reports the database as reachable and four seeded platforms:

   ```json
   { "status": "healthy", "database": "reachable", "platforms": 4 }
   ```

## Configuration

All settings come from environment variables (loaded from `.env` in development).
`DATABASE_URL` accepts either a URI such as
`postgresql://user:pass@host:5432/dbname?sslmode=require` or a plain Npgsql connection
string. Platform credentials are introduced step by step and stay blank until needed.

## Build roadmap

The backend is built one integration at a time. Each step lands real data and is
verified before the next begins.

- Step 0: Skeleton (project, database, migrations, empty schema) &larr; current
- Step 1: Codeforces sync
- Step 2: GitHub sync
- Step 3: AtCoder sync
- Step 4: LeetCode aggregate stats
- Step 5: LeetCode submission detail
- Step 6: Hangfire scheduler
- Step 7: Public read API endpoints
- Phase 2: React frontend
- Phase 3: Deployment and visual polish
