using EnergiaApi.Models;
using EnergiaApi.Services;
using Microsoft.AspNetCore.Http.HttpResults;

namespace EnergiaApi.Endpoints;

public static class TesoreriaEndpoints
{
    public static IEndpointRouteBuilder MapTesoreriaEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/tesoreria").WithTags("Tesorería");

        grupo.MapGet("/saldo-banco",
            async Task<Results<Ok<SaldoBancoResponse>, NotFound<ErrorResponse>>>
            (BancoClient banco, IConfiguration cfg) =>
            {
                var empresa = cfg["EmpresaNombre"] ?? "Energia";
                var saldo = await banco.ConsultarSaldoEmpresaAsync(empresa);
                if (saldo is null)
                {
                    return TypedResults.NotFound(new ErrorResponse(
                        "CUENTA_NO_ENCONTRADA",
                        $"No se pudo consultar la cuenta empresa '{empresa}' en el banco."));
                }
                return TypedResults.Ok(saldo);
            })
            .WithSummary("Consulta el saldo de la cuenta transitoria de la empresa en el banco.");

        return app;
    }
}
