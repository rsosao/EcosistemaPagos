using EnergiaApi.Data;
using EnergiaApi.Models;
using EnergiaApi.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Endpoints;

/// <summary>
/// API pública consumida por el BancoApi (Flujo A: banca virtual).
/// </summary>
public static class ApiPublicaEndpoints
{
    public static IEndpointRouteBuilder MapApiPublicaEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api").WithTags("Api Pública (Banco)");

        grupo.MapGet("/deuda/{idCliente}",
            async Task<Results<Ok<DeudaResponse>, NotFound<ErrorResponse>>>
            (string idCliente, EnergiaDbContext db) =>
            {
                var cliente = await db.Clientes.FindAsync(idCliente);
                if (cliente is null)
                    return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"No existe cliente con contador {idCliente}."));

                var pendientes = await db.Cuotas
                    .Where(c => c.ClienteId == idCliente && !c.Pagada)
                    .OrderBy(c => c.Periodo)
                    .Select(c => new DeudaDetalleItem(c.Periodo, c.Monto))
                    .ToListAsync();

                var total = pendientes.Sum(d => d.Monto);
                return TypedResults.Ok(new DeudaResponse(cliente.Id, cliente.Nombre, total, pendientes));
            })
            .WithSummary("Consulta de deuda por número de contador (consumido por el banco).");

        grupo.MapPost("/pagos/confirmar",
            async Task<Results<Ok<ConfirmarPagoResponse>, NotFound<ErrorResponse>, BadRequest<ErrorResponse>>>
            (ConfirmarPagoRequest req, EnergiaDbContext db, PagosService pagos) =>
            {
                if (string.IsNullOrWhiteSpace(req.IdCliente) || req.Monto <= 0 || string.IsNullOrWhiteSpace(req.Referencia))
                    return TypedResults.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "IdCliente, Monto > 0 y Referencia son obligatorios."));

                var cliente = await db.Clientes.FindAsync(req.IdCliente);
                if (cliente is null)
                    return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"No existe cliente con contador {req.IdCliente}."));

                if (!Enum.TryParse<MetodoPago>(req.Metodo, true, out var metodo))
                {
                    metodo = MetodoPago.BancaVirtual;
                }

                var (aplicado, pendiente, _) = await pagos.AplicarPagoAsync(req.IdCliente, req.Monto, metodo, req.Referencia);

                return TypedResults.Ok(new ConfirmarPagoResponse("OK",
                    $"Pago aplicado: Q{aplicado:F2}. Saldo restante: Q{pendiente:F2}.", pendiente));
            })
            .WithSummary("Confirmación de pago desde el banco (Flujo A).");

        return app;
    }
}
