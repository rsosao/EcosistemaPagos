using BancoApi.Data;
using BancoApi.Dtos;
using BancoApi.Models;
using BancoApi.Services;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Endpoints;

public static class ApiPublicaEndpoints
{
    public static IEndpointRouteBuilder MapApiPublicaEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("API Pública (consumida por empresas)");

        group.MapPost("/tarjetas/validar",
            async (ValidarTarjetaRequest req, BancoDbContext db) =>
            {
                var numero = TarjetaUtil.NormalizarNumero(req.Numero);
                var cvv = TarjetaUtil.NormalizarCvv(req.Cvv);
                var tarjeta = await db.Tarjetas
                    .Include(t => t.Cuenta)
                        .ThenInclude(c => c!.Cliente)
                    .FirstOrDefaultAsync(t => t.Numero == numero && t.Cvv == cvv);

                if (tarjeta is null)
                    return Results.Ok(new ValidarTarjetaResponse(
                        false, null, null, "TARJETA_INVALIDA", "Número o CVV incorrectos."));
                if (!tarjeta.Activa)
                    return Results.Ok(new ValidarTarjetaResponse(
                        false, tarjeta.Tipo.ToString(), tarjeta.Cuenta?.Cliente?.Nombre,
                        "TARJETA_INVALIDA", "La tarjeta no está activa."));
                if (tarjeta.FechaVencimiento < DateOnly.FromDateTime(DateTime.UtcNow))
                    return Results.Ok(new ValidarTarjetaResponse(
                        false, tarjeta.Tipo.ToString(), tarjeta.Cuenta?.Cliente?.Nombre,
                        "TARJETA_VENCIDA", "La tarjeta está vencida."));

                return Results.Ok(new ValidarTarjetaResponse(
                    true,
                    tarjeta.Tipo.ToString(),
                    tarjeta.Cuenta?.Cliente?.Nombre,
                    "OK",
                    null));
            });

        group.MapPost("/pagos/procesar",
            async (PagoProcesarRequest req,
                BancoDbContext db,
                IServiciosEmpresaResolver resolver,
                IPagosService pagosService) =>
            {
                var empresaNombre = resolver.NormalizarNombre(req.Empresa);
                if (empresaNombre is null)
                    return Results.BadRequest(new PagoProcesarResponse(
                        false, "EMPRESA_DESCONOCIDA",
                        $"Empresa '{req.Empresa}' no reconocida.", null, null));

                var numeroPago = TarjetaUtil.NormalizarNumero(req.Numero);
                var cvvPago = TarjetaUtil.NormalizarCvv(req.Cvv);
                var tarjeta = await db.Tarjetas
                    .Include(t => t.Cuenta)
                    .FirstOrDefaultAsync(t => t.Numero == numeroPago && t.Cvv == cvvPago);
                if (tarjeta is null)
                    return Results.Ok(new PagoProcesarResponse(
                        false, "TARJETA_INVALIDA",
                        "Número o CVV incorrectos.", null, null));
                if (!tarjeta.Activa)
                    return Results.Ok(new PagoProcesarResponse(
                        false, "TARJETA_INVALIDA",
                        "La tarjeta no está activa.", null, null));
                if (tarjeta.FechaVencimiento < DateOnly.FromDateTime(DateTime.UtcNow))
                    return Results.Ok(new PagoProcesarResponse(
                        false, "TARJETA_VENCIDA",
                        "La tarjeta está vencida.", null, null));
                if (req.Monto <= 0)
                    return Results.BadRequest(new PagoProcesarResponse(
                        false, "MONTO_INVALIDO",
                        "El monto debe ser mayor a cero.", null, null));
                if (tarjeta.Cuenta is null)
                    return Results.Ok(new PagoProcesarResponse(
                        false, "CUENTA_NO_ENCONTRADA",
                        "La tarjeta no tiene cuenta asociada.", null, null));

                var resultado = await pagosService.DebitarYAcreditarAsync(
                    tarjeta.Cuenta,
                    req.Monto,
                    empresaNombre,
                    TipoMovimiento.PagoServicio,
                    $"Pago con tarjeta a {empresaNombre} (ref externa {req.Referencia})",
                    referenciaExterna: req.Referencia);

                if (!resultado.Exito)
                    return Results.Ok(new PagoProcesarResponse(
                        false, resultado.Codigo, resultado.Mensaje, null, null));

                return Results.Ok(new PagoProcesarResponse(
                    true, "OK", null, resultado.Referencia, resultado.Comision));
            });

        group.MapGet("/cuenta-empresa/{empresa}/saldo",
            async (string empresa,
                BancoDbContext db,
                IServiciosEmpresaResolver resolver) =>
            {
                var nombre = resolver.NormalizarNombre(empresa);
                if (nombre is null)
                    return Results.NotFound(new ErrorResponse("EMPRESA_DESCONOCIDA",
                        $"Empresa '{empresa}' no reconocida."));

                var cuentaEmp = await db.CuentasEmpresa
                    .Include(c => c.Cuenta)
                    .FirstOrDefaultAsync(c => c.Nombre == nombre);
                if (cuentaEmp?.Cuenta is null)
                    return Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                        $"No hay cuenta transitoria para {nombre}."));

                var ultimos = await db.Movimientos
                    .Where(m => m.CuentaId == cuentaEmp.CuentaId)
                    .OrderByDescending(m => m.Fecha)
                    .Take(10)
                    .ToListAsync();

                var resumen = ultimos
                    .Select(m => new MovimientoResumen(
                        m.Id, m.Tipo.ToString(), m.Monto, m.Fecha, m.Referencia, m.Descripcion))
                    .ToList();

                return Results.Ok(new CuentaEmpresaSaldoResponse(
                    nombre,
                    cuentaEmp.Cuenta.Saldo,
                    resumen));
            });

        return app;
    }
}
