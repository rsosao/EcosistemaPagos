using Microsoft.EntityFrameworkCore;
using UniversidadApi.Data;
using UniversidadApi.Dtos;

namespace UniversidadApi.Endpoints;

public static class ReportesEndpoints
{
    public static IEndpointRouteBuilder MapReportesEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/reportes").WithTags("Reportes");

        grupo.MapGet("/clientes-pendientes", async (AppDbContext db) =>
        {
            var clientes = await db.Clientes.Include(c => c.Cuotas).ToListAsync();
            var data = clientes
                .Where(c => c.Cuotas.Any(q => !q.Pagada))
                .Select(c =>
                {
                    var pendientes = c.Cuotas.Where(q => !q.Pagada).ToList();
                    return new ClientePendienteDto(
                        c.Id,
                        c.Nombre,
                        pendientes.Sum(q => q.Monto),
                        pendientes.Count);
                })
                .ToList();

            return Results.Ok(data);
        });

        grupo.MapGet("/clientes-pagados", async (string? periodo, AppDbContext db) =>
        {
            var query = db.Cuotas
                .Include(c => c.Cliente)
                .Where(c => c.Pagada);
            if (!string.IsNullOrWhiteSpace(periodo))
                query = query.Where(c => c.Periodo == periodo);

            var cuotas = await query
                .OrderBy(c => c.Periodo)
                .ThenBy(c => c.ClienteId)
                .ToListAsync();

            var data = cuotas.Select(c => new ClientePagadoDto(
                c.ClienteId,
                c.Cliente?.Nombre ?? string.Empty,
                c.Periodo,
                c.FechaPago,
                c.MetodoPago.HasValue ? c.MetodoPago.Value.ToString() : null)).ToList();

            return Results.Ok(data);
        });

        grupo.MapGet("/movimientos", async (AppDbContext db) =>
        {
            var movimientos = await db.Movimientos
                .OrderByDescending(m => m.Fecha)
                .ToListAsync();

            var data = movimientos.Select(m => new MovimientoDto(
                m.Id,
                m.Tipo.ToString(),
                m.Monto,
                m.Fecha,
                m.ClienteId,
                m.Referencia)).ToList();

            return Results.Ok(data);
        });

        grupo.MapGet("/comprobante/{referencia}", async (string referencia, AppDbContext db) =>
        {
            var cuotas = await db.Cuotas
                .Include(c => c.Cliente)
                .Where(c => c.Referencia == referencia)
                .ToListAsync();

            if (cuotas.Count == 0)
                return Results.NotFound(new ErrorResponse("COMPROBANTE_NO_ENCONTRADO",
                    $"No existe pago con referencia {referencia}"));

            var primera = cuotas.First();
            var cliente = primera.Cliente!;
            var monto = cuotas.Sum(c => c.Monto);
            var fecha = primera.FechaPago ?? DateTime.UtcNow;
            var metodo = primera.MetodoPago?.ToString() ?? "Desconocido";
            var periodos = cuotas.Select(c => c.Periodo).OrderBy(p => p).ToList();

            return Results.Ok(new ComprobanteDto(
                referencia, cliente.Id, cliente.Nombre, monto, metodo, fecha, periodos));
        });

        grupo.MapGet("/estado-cuenta/{idCliente}", async (string idCliente, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(idCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO",
                    $"Cliente {idCliente} no existe"));

            var cuotas = await db.Cuotas
                .Where(c => c.ClienteId == idCliente)
                .OrderBy(c => c.Periodo)
                .ToListAsync();

            var pendientes = cuotas.Where(c => !c.Pagada)
                .Select(c => new CuotaDto(c.Id, c.Periodo, c.Monto, c.Pagada, c.FechaPago,
                    c.MetodoPago.HasValue ? c.MetodoPago.Value.ToString() : null, c.Referencia))
                .ToList();
            var pagadas = cuotas.Where(c => c.Pagada)
                .Select(c => new CuotaDto(c.Id, c.Periodo, c.Monto, c.Pagada, c.FechaPago,
                    c.MetodoPago.HasValue ? c.MetodoPago.Value.ToString() : null, c.Referencia))
                .ToList();
            var deuda = pendientes.Sum(c => c.Monto);

            return Results.Ok(new EstadoCuentaDto(cliente.Id, cliente.Nombre, deuda, pendientes, pagadas));
        });

        return app;
    }
}
