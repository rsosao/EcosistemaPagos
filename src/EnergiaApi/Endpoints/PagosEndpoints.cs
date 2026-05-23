using EnergiaApi.Data;
using EnergiaApi.Models;
using EnergiaApi.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Endpoints;

public static class PagosEndpoints
{
    public static IEndpointRouteBuilder MapPagosEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/pagar").WithTags("Pagos");

        // --- Flujo C: Efectivo (sin banco) ---
        grupo.MapPost("/efectivo",
            async Task<Results<Ok<PagoEfectivoResponse>, NotFound<ErrorResponse>, BadRequest<ErrorResponse>>>
            (PagoEfectivoRequest req, EnergiaDbContext db, PagosService pagos) =>
            {
                if (string.IsNullOrWhiteSpace(req.IdCliente) || req.Monto <= 0)
                    return TypedResults.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "IdCliente y Monto > 0 son obligatorios."));

                var cliente = await db.Clientes.FindAsync(req.IdCliente);
                if (cliente is null)
                    return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"No existe cliente con contador {req.IdCliente}."));

                var deuda = await pagos.CalcularDeudaAsync(req.IdCliente);
                if (deuda <= 0)
                    return TypedResults.BadRequest(new ErrorResponse("SIN_DEUDA", "El cliente no tiene cuotas pendientes."));

                var referencia = string.IsNullOrWhiteSpace(req.Referencia)
                    ? $"EFE-{Guid.NewGuid():N}"[..16]
                    : req.Referencia!;

                var (aplicado, pendiente, _) = await pagos.AplicarPagoAsync(req.IdCliente, req.Monto, MetodoPago.Efectivo, referencia);

                return TypedResults.Ok(new PagoEfectivoResponse("OK", referencia, aplicado, pendiente));
            })
            .WithSummary("Pago en efectivo. No invoca al banco (Flujo C).");

        // --- Flujo B: Pasarela con tarjeta (consume BancoApi) ---
        grupo.MapPost("/tarjeta",
            async Task<Results<Ok<PagoTarjetaResponse>, NotFound<ErrorResponse>, BadRequest<ErrorResponse>, UnprocessableEntity<PagoTarjetaResponse>>>
            (PagoTarjetaRequest req, EnergiaDbContext db, PagosService pagos, BancoClient banco, IConfiguration cfg) =>
            {
                if (string.IsNullOrWhiteSpace(req.IdCliente) || string.IsNullOrWhiteSpace(req.Numero) || string.IsNullOrWhiteSpace(req.Cvv))
                    return TypedResults.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "IdCliente, Numero y Cvv son obligatorios."));

                var cliente = await db.Clientes.FindAsync(req.IdCliente);
                if (cliente is null)
                    return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"No existe cliente con contador {req.IdCliente}."));

                var deuda = await pagos.CalcularDeudaAsync(req.IdCliente);
                if (deuda <= 0)
                    return TypedResults.BadRequest(new ErrorResponse("SIN_DEUDA", "El cliente no tiene cuotas pendientes."));

                // 1) Validar tarjeta contra el banco
                var validacion = await banco.ValidarTarjetaAsync(new ValidarTarjetaRequest(req.Numero, req.Cvv));
                if (validacion is null || !validacion.Valida)
                {
                    return TypedResults.UnprocessableEntity(new PagoTarjetaResponse(
                        false,
                        validacion?.Codigo ?? "TARJETA_INVALIDA",
                        null, 0m, null,
                        validacion?.Mensaje ?? "Tarjeta no válida."));
                }

                // 2) Procesar el pago en el banco
                var referencia = $"EE-{Guid.NewGuid():N}"[..16];
                var empresa = cfg["EmpresaNombre"] ?? "Energia";
                var resultado = await banco.ProcesarPagoAsync(new ProcesarPagoRequest(req.Numero, req.Cvv, deuda, empresa, referencia));

                if (resultado is null || !resultado.Autorizado)
                {
                    return TypedResults.UnprocessableEntity(new PagoTarjetaResponse(
                        false,
                        resultado?.Codigo ?? "PAGO_NO_AUTORIZADO",
                        resultado?.ReferenciaBancaria,
                        0m,
                        resultado?.ComisionRetenida,
                        resultado?.Mensaje ?? "El banco no autorizó el pago."));
                }

                // 3) Marcar cuotas como pagadas
                var (aplicado, _, _) = await pagos.AplicarPagoAsync(
                    req.IdCliente,
                    deuda,
                    MetodoPago.Tarjeta,
                    resultado.ReferenciaBancaria ?? referencia);

                return TypedResults.Ok(new PagoTarjetaResponse(
                    true,
                    "OK",
                    resultado.ReferenciaBancaria ?? referencia,
                    aplicado,
                    resultado.ComisionRetenida,
                    "Pago autorizado."));
            })
            .WithSummary("Pasarela de pago con tarjeta (Flujo B). Llama a BancoApi.");

        return app;
    }
}
