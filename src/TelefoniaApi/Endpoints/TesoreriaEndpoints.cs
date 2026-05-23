using TelefoniaApi.Services;

namespace TelefoniaApi.Endpoints;

public static class TesoreriaEndpoints
{
    public static IEndpointRouteBuilder MapTesoreria(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/tesoreria").WithTags("Tesorería");

        grupo.MapGet("/saldo-banco", async (BancoClient banco, IConfiguration cfg) =>
        {
            var empresa = cfg["EmpresaNombre"] ?? "Telefonia";
            var saldo = await banco.ConsultarSaldoEmpresaAsync(empresa);
            if (saldo is null)
                return Results.Problem(
                    title: "BANCO_INACCESIBLE",
                    detail: "No se pudo consultar el saldo en BancoApi.",
                    statusCode: StatusCodes.Status502BadGateway);
            return Results.Ok(saldo);
        });

        return app;
    }
}
