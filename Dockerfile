# ---------------------------------------------------------------------------
# Stage 1: build
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Restore dependencies first (layer cache-friendly)
COPY YukiVerse.sln .
COPY src/YukiVerse.Api/YukiVerse.Api.csproj src/YukiVerse.Api/
RUN dotnet restore src/YukiVerse.Api/YukiVerse.Api.csproj

# Copy everything and publish
COPY . .
RUN dotnet publish src/YukiVerse.Api \
    -c Release \
    -o /app/publish \
    --no-restore

# ---------------------------------------------------------------------------
# Stage 2: runtime (smaller image)
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Railway injects PORT at runtime; ASP.NET Core reads ASPNETCORE_URLS
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

EXPOSE 8080
ENTRYPOINT ["dotnet", "YukiVerse.Api.dll"]
