using EnergiaApi.Data;
using EnergiaApi.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Endpoints;

public static class ReportesEndpoints
{
    public static IEndpointRouteBuilder MapReportesEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/reportes").WithTags("Reportes");

        grupo.MapGet("/clientes-pendientes", async (EnergiaDbContext db) =>
        {
            var clientes = await db.Clientes.Include(c => c.Cuotas).ToListAsync();
            var items = clientes
                .Where(cli => cli.Cuotas.Any(q => !q.Pagada))
                .Select(cli =>
                {
                    var pendientes = cli.Cuotas.Where(q => !q.Pagada).ToList();
                    return new ClientePendienteItem(
                        cli.Id,
                        cli.Nombre,
                        pendientes.Sum(c => c.Monto),
                        pendientes.Count);
                })
                .ToList();

            return Results.Ok(items);
        })
        .WithSummary("Clientes con cuotas no pagadas.");

        grupo.MapGet("/clientes-pagados", async (string? periodo, EnergiaDbContext db) =>
        {
            var query = db.Cuotas.Where(c => c.Pagada);
            if (!string.IsNullOrWhiteSpace(periodo))
                query = query.Where(c => c.Periodo == periodo);

            var cuotas = await query
                .Include(c => c.Cliente)
                .OrderBy(c => c.Periodo)
                .ThenBy(c => c.ClienteId)
                .ToListAsync();

            var items = cuotas.Select(c => new ClientePagadoItem(
                c.ClienteId,
                c.Cliente?.Nombre ?? string.Empty,
                c.Periodo,
                c.FechaPago)).ToList();

            return Results.Ok(items);
        })
        .WithSummary("Clientes al día (opcionalmente filtrado por periodo).");

        grupo.MapGet("/movimientos", async (EnergiaDbContext db) =>
        {
            var movimientos = await db.Movimientos
                .OrderByDescending(m => m.Fecha)
                .ToListAsync();
            var items = movimientos.Select(m => new MovimientoReporteItem(
                m.Id, m.Tipo.ToString(), m.Monto, m.Fecha, m.ClienteId, m.Referencia)).ToList();
            return Results.Ok(items);
        })
        .WithSummary("Bitácora de cuotas generadas y pagos recibidos.");

        grupo.MapGet("/comprobante/{referencia}",
            async Task<Results<Ok<ComprobanteResponse>, NotFound<ErrorResponse>>>
            (string referencia, EnergiaDbContext db) =>
            {
                var cuota = await db.Cuotas
                    .Include(c => c.Cliente)
                    .FirstOrDefaultAsync(c => c.Referencia == referencia && c.Pagada);

                if (cuota is null)
                {
                    return TypedResults.NotFound(new ErrorResponse(
                        "COMPROBANTE_NO_ENCONTRADO",
                        $"No se encontró un pago con referencia {referencia}."));
                }

                return TypedResults.Ok(new ComprobanteResponse(
                    referencia,
                    cuota.ClienteId,
                    cuota.Cliente!.Nombre,
                    cuota.Periodo,
                    cuota.Monto,
                    cuota.MetodoPago?.ToString() ?? "-",
                    cuota.FechaPago ?? DateTime.UtcNow));
            })
        .WithSummary("Comprobante de un pago por referencia.");

        grupo.MapGet("/estado-cuenta/{idCliente}",
            async Task<Results<Ok<EstadoCuentaResponse>, NotFound<ErrorResponse>>>
            (string idCliente, EnergiaDbContext db) =>
            {
                var cliente = await db.Clientes.FindAsync(idCliente);
                if (cliente is null)
                    return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO",
                        $"No existe cliente con contador {idCliente}."));

                var cuotas = await db.Cuotas
                    .Where(c => c.ClienteId == idCliente)
                    .OrderBy(c => c.Periodo)
                    .ToListAsync();

                var detalle = cuotas.Select(c => new CuotaDetalle(
                    c.Id, c.Periodo, c.Monto, c.Pagada, c.FechaPago, c.MetodoPago?.ToString(), c.Referencia)).ToList();

                return TypedResults.Ok(new EstadoCuentaResponse(
                    cliente.Id, cliente.Nombre,
                    cuotas.Where(c => !c.Pagada).Sum(c => c.Monto),
                    cuotas.Where(c => c.Pagada).Sum(c => c.Monto),
                    detalle));
            })
        .WithSummary("Estado de cuenta detallado del cliente.");

        return app;
    }
}
