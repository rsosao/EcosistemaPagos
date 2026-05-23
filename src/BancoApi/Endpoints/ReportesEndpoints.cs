using BancoApi.Data;
using BancoApi.Dtos;
using BancoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Endpoints;

public static class ReportesEndpoints
{
    public static IEndpointRouteBuilder MapReportesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/reportes").WithTags("Reportes");

        group.MapGet("/comisiones",
            async (DateTime? desde, DateTime? hasta, BancoDbContext db) =>
            {
                var d = desde ?? DateTime.UtcNow.AddMonths(-1);
                var h = hasta ?? DateTime.UtcNow;

                var cuentaComi = await db.CuentaComisiones
                    .Include(c => c.Cuenta)
                    .FirstOrDefaultAsync();
                if (cuentaComi?.Cuenta is null)
                    return Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                        "No hay cuenta de comisiones configurada."));

                var movs = await db.Movimientos
                    .Where(m => m.CuentaId == cuentaComi.CuentaId
                        && m.Tipo == TipoMovimiento.Comision
                        && m.Fecha >= d && m.Fecha <= h)
                    .OrderBy(m => m.Fecha)
                    .ToListAsync();

                var total = movs.Sum(m => m.Monto);
                var detalle = movs.Select(m => m.ToDto()).ToList();

                return Results.Ok(new
                {
                    desde = d,
                    hasta = h,
                    totalComisiones = total,
                    cantidad = movs.Count,
                    detalle
                });
            });

        group.MapGet("/movimientos-cuenta-banco", async (BancoDbContext db) =>
        {
            var cuentaComi = await db.CuentaComisiones
                .Include(c => c.Cuenta)
                .FirstOrDefaultAsync();
            if (cuentaComi?.Cuenta is null)
                return Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                    "No hay cuenta del banco configurada."));

            var movs = await db.Movimientos
                .Where(m => m.CuentaId == cuentaComi.CuentaId)
                .OrderByDescending(m => m.Fecha)
                .ToListAsync();

            return Results.Ok(new
            {
                cuenta = cuentaComi.Cuenta.NumeroCuenta,
                saldo = cuentaComi.Cuenta.Saldo,
                movimientos = movs.Select(m => m.ToDto()).ToList()
            });
        });

        group.MapGet("/comprobante/{referencia}",
            async (string referencia, BancoDbContext db) =>
            {
                var movs = await db.Movimientos
                    .Include(m => m.Cuenta)
                    .Where(m => m.Referencia == referencia)
                    .OrderBy(m => m.Tipo)
                    .ToListAsync();

                if (movs.Count == 0)
                    return Results.NotFound(new ErrorResponse("REFERENCIA_NO_ENCONTRADA",
                        $"No existen movimientos con referencia {referencia}."));

                var origen = movs.FirstOrDefault(m =>
                    m.Tipo == TipoMovimiento.PagoServicio ||
                    m.Tipo == TipoMovimiento.CompraPOS ||
                    m.Tipo == TipoMovimiento.RetiroCajero ||
                    m.Tipo == TipoMovimiento.Retiro);
                var acreditacion = movs.FirstOrDefault(m => m.Tipo == TipoMovimiento.AcreditacionServicio);
                var comision = movs.FirstOrDefault(m =>
                    m.Tipo == TipoMovimiento.Comision &&
                    m.CuentaId != (origen?.CuentaId ?? -1));

                return Results.Ok(new
                {
                    referencia,
                    fecha = origen?.Fecha ?? movs[0].Fecha,
                    cuentaOrigen = origen?.Cuenta?.NumeroCuenta,
                    montoTotal = origen?.Monto ?? movs.Sum(m => m.Monto),
                    acreditado = acreditacion?.Monto,
                    comision = comision?.Monto,
                    descripcion = origen?.Descripcion,
                    movimientos = movs.Select(m => m.ToDto()).ToList()
                });
            });

        return app;
    }
}
