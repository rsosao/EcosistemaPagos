using BancoApi.Services;

namespace BancoApi.Endpoints;

public static class SeedEndpoints
{
    public static IEndpointRouteBuilder MapSeedEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/seed", async (ISeedService seed) =>
        {
            var resultado = await seed.EjecutarAsync();
            return Results.Ok(resultado);
        })
        .WithTags("Seed");

        return app;
    }
}
