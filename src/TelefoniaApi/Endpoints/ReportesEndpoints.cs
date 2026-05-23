using Microsoft.EntityFrameworkCore;
using TelefoniaApi.Data;
using TelefoniaApi.Services;

namespace TelefoniaApi.Endpoints;

public static class ReportesEndpoints
{
    public static IEndpointRouteBuilder MapReportes(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/reportes").WithTags("Reportes");

        grupo.MapGet("/clientes-pendientes", async (AppDbContext db) =>
        {
            var clientes = await db.Clientes.Include(c => c.Cuotas).ToListAsync();
            var resp = clientes
                .Where(cl => cl.Cuotas.Any(c => !c.Pagada))
                .Select(cl =>
                {
                    var pendientes = cl.Cuotas.Where(c => !c.Pagada).ToList();
                    return new ClientePendienteResponse(
                        cl.Id,
                        cl.Nombre,
                        pendientes.Sum(c => c.Monto),
                        pendientes.Count);
                })
                .ToList();
            return Results.Ok(resp);
        });

        grupo.MapGet("/clientes-pagados", async (string? periodo, AppDbContext db) =>
        {
            var q = db.Cuotas
                .Include(c => c.Cliente)
                .Where(c => c.Pagada);
            if (!string.IsNullOrWhiteSpace(periodo))
                q = q.Where(c => c.Periodo == periodo);

            var cuotas = await q.OrderByDescending(c => c.FechaPago).ToListAsync();
            var lista = cuotas.Select(c => new ClientePagadoResponse(
                c.ClienteId,
                c.Cliente?.Nombre ?? string.Empty,
                c.Periodo,
                c.Monto,
                c.FechaPago)).ToList();
            return Results.Ok(lista);
        });

        grupo.MapGet("/movimientos", async (AppDbContext db) =>
        {
            var movimientos = await db.Movimientos
                .OrderByDescending(m => m.Fecha)
                .ToListAsync();
            var lista = movimientos.Select(m => new MovimientoResponse(
                m.Id, m.Tipo.ToString(), m.Monto, m.Fecha, m.ClienteId, m.Referencia)).ToList();
            return Results.Ok(lista);
        });

        grupo.MapGet("/comprobante/{referencia}", async (string referencia, AppDbContext db) =>
        {
            var cuotas = await db.Cuotas
                .Include(c => c.Cliente)
                .Where(c => c.Referencia == referencia && c.Pagada)
                .ToListAsync();

            if (cuotas.Count == 0)
                return Results.NotFound(new ErrorResponse("COMPROBANTE_NO_ENCONTRADO", "No existe un pago con esa referencia."));

            var primera = cuotas[0];
            var detalle = cuotas
                .OrderBy(c => c.Periodo)
                .Select(c => c.ToDetalle())
                .ToList();

            return Results.Ok(new ComprobanteResponse(
                Referencia: referencia,
                IdCliente: primera.ClienteId,
                Nombre: primera.Cliente?.Nombre ?? string.Empty,
                Monto: cuotas.Sum(c => c.Monto),
                Metodo: primera.MetodoPago?.ToString() ?? "Desconocido",
                Fecha: primera.FechaPago ?? DateTime.UtcNow,
                CuotasPagadas: detalle));
        });

        grupo.MapGet("/estado-cuenta/{idCliente}", async (string idCliente, AppDbContext db) =>
        {
            var cliente = await db.Clientes
                .Include(c => c.Cuotas)
                .FirstOrDefaultAsync(c => c.Id == idCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));

            var cuotas = cliente.Cuotas
                .OrderBy(c => c.Periodo)
                .Select(c => c.ToDetalle())
                .ToList();

            var pendiente = cliente.Cuotas.Where(c => !c.Pagada).Sum(c => c.Monto);
            return Results.Ok(new EstadoCuentaResponse(cliente.Id, cliente.Nombre, pendiente, cuotas));
        });

        return app;
    }
}
