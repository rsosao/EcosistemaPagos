using UniversidadApi.Dtos;
using UniversidadApi.Services;

namespace UniversidadApi.Endpoints;

public static class TesoreriaEndpoints
{
    public static IEndpointRouteBuilder MapTesoreriaEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/tesoreria").WithTags("Tesorería");

        grupo.MapGet("/saldo-banco", async (BancoClient banco, IConfiguration cfg, ILogger<BancoClient> logger) =>
        {
            var empresa = cfg["EmpresaNombre"] ?? "Universidad";
            try
            {
                var resp = await banco.GetSaldoEmpresaAsync(empresa);
                if (!resp.IsSuccessStatusCode)
                {
                    var body = await resp.Content.ReadAsStringAsync();
                    return Results.Problem(
                        title: "No se pudo consultar el saldo en el banco",
                        detail: body,
                        statusCode: (int)resp.StatusCode);
                }
                var json = await resp.Content.ReadAsStringAsync();
                return Results.Content(json, "application/json");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error consultando saldo bancario");
                return Results.Problem(
                    title: "BANCO_NO_DISPONIBLE",
                    detail: ex.Message,
                    statusCode: 503);
            }
        });

        return app;
    }
}
