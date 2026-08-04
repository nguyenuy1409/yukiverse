namespace YukiVerse.Api.Infrastructure;

/// <summary>
/// Loads a local .env file into the process environment. The file lives at the repository
/// root while the app runs from its bin directory, and design-time tooling (dotnet ef) uses
/// yet another working directory, so we walk up from the base directory until we find it.
/// On a managed host there is no .env and the variables are already present, so this is a no-op.
/// </summary>
public static class DotEnvLoader
{
    public static void Load()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, ".env");
            if (File.Exists(candidate))
            {
                DotNetEnv.Env.Load(candidate);
                return;
            }

            directory = directory.Parent;
        }
    }
}
