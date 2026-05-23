using BancoApi.Data;
using BancoApi.Dtos;
using BancoApi.Models;
using BancoApi.Services;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Endpoints;

public static class PagosServicioEndpoints
{
    public static IEndpointRouteBuilder MapPagosServicioEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/pagos").WithTags("Pagos (Banca Virtual)");

        group.MapPost("/servicio",
            async (PagoServicioRequest req,
                BancoDbContext db,
                IServiciosEmpresaResolver resolver,
                IPagosService pagosService) =>
            {
                var empresaNombre = resolver.NormalizarNombre(req.Servicio);
                if (empresaNombre is null)
                    return Results.BadRequest(new ErrorResponse("EMPRESA_DESCONOCIDA",
                        $"Servicio '{req.Servicio}' no es válido. Use universidad/telefonia/energia."));

                var cliente = resolver.Resolver(empresaNombre);
                if (cliente is null)
                    return Results.BadRequest(new ErrorResponse("EMPRESA_DESCONOCIDA",
                        $"No hay cliente configurado para '{empresaNombre}'."));

                var cuenta = await db.Cuentas.FirstOrDefaultAsync(c => c.Id == req.IdCuentaBanco);
                if (cuenta is null)
                    return Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                        $"Cuenta del banco {req.IdCuentaBanco} no existe."));

                DeudaResponse? deuda;
                try
                {
                    deuda = await cliente.ObtenerDeudaAsync(req.IdClienteServicio);
                }
                catch (HttpRequestException ex)
                {
                    return Results.Problem(
                        title: "Error al comunicarse con la empresa",
                        detail: ex.Message,
                        statusCode: 502);
                }

                if (deuda is null)
                    return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO",
                        "La empresa no encontró al cliente."));

                if (deuda.Total <= 0)
                    return Results.BadRequest(new ErrorResponse("SIN_DEUDA",
                        "El cliente no tiene deuda pendiente."));

                var resultado = await pagosService.DebitarYAcreditarAsync(
                    cuenta,
                    deuda.Total,
                    empresaNombre,
                    TipoMovimiento.PagoServicio,
                    $"Pago banca virtual a {empresaNombre} - cliente {req.IdClienteServicio}",
                    referenciaExterna: null);

                if (!resultado.Exito)
                    return Results.BadRequest(new ErrorResponse(resultado.Codigo,
                        resultado.Mensaje ?? "No se pudo procesar el pago."));

                bool confirmado = false;
                try
                {
                    confirmado = await cliente.ConfirmarPagoAsync(new PagoConfirmarRequest(
                        req.IdClienteServicio,
                        deuda.Total,
                        resultado.Referencia!,
                        "BancaVirtual"));
                }
                catch (HttpRequestException)
                {
                    confirmado = false;
                }

                return Results.Ok(new
                {
                    autorizado = true,
                    codigo = "OK",
                    referenciaBancaria = resultado.Referencia,
                    montoDebitado = deuda.Total,
                    acreditado = resultado.Acreditado,
                    comisionRetenida = resultado.Comision,
                    confirmacionEmpresa = confirmado,
                    empresa = empresaNombre,
                    saldoCuenta = cuenta.Saldo
                });
            });

        return app;
    }
}
