using Microsoft.EntityFrameworkCore;
using UniversidadApi.Data;
using UniversidadApi.Dtos;
using UniversidadApi.Models;

namespace UniversidadApi.Endpoints;

public static class CuotasEndpoints
{
    public static IEndpointRouteBuilder MapCuotasEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/generar-cuotas", async (GenerarCuotasDto dto, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Periodo) || dto.Monto <= 0)
                return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "Periodo y monto son obligatorios"));

            var clientes = await db.Clientes.ToListAsync();
            if (clientes.Count == 0)
                return Results.Ok(new { generadas = 0, mensaje = "No hay clientes registrados" });

            var existentes = await db.Cuotas
                .Where(c => c.Periodo == dto.Periodo)
                .Select(c => c.ClienteId)
                .ToListAsync();

            var nuevas = 0;
            foreach (var cliente in clientes)
            {
                if (existentes.Contains(cliente.Id)) continue;

                var cuota = new Cuota
                {
                    ClienteId = cliente.Id,
                    Periodo = dto.Periodo,
                    Monto = dto.Monto,
                    Pagada = false
                };
                db.Cuotas.Add(cuota);

                db.Movimientos.Add(new MovimientoEmpresa
                {
                    Tipo = TipoMovimiento.CuotaGenerada,
                    Monto = dto.Monto,
                    Fecha = DateTime.UtcNow,
                    ClienteId = cliente.Id,
                    Referencia = $"CUOTA-{dto.Periodo}-{cliente.Id}"
                });
                nuevas++;
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { generadas = nuevas, periodo = dto.Periodo, monto = dto.Monto });
        }).WithTags("Cuotas");

        app.MapPost("/clientes/{id}/cuota", async (string id, CuotaManualDto dto, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(id);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {id} no existe"));

            if (string.IsNullOrWhiteSpace(dto.Periodo) || dto.Monto <= 0)
                return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "Periodo y monto son obligatorios"));

            var cuota = new Cuota
            {
                ClienteId = id,
                Periodo = dto.Periodo,
                Monto = dto.Monto,
                Pagada = false
            };
            db.Cuotas.Add(cuota);

            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimiento.CuotaGenerada,
                Monto = dto.Monto,
                Fecha = DateTime.UtcNow,
                ClienteId = id,
                Referencia = $"CUOTA-{dto.Periodo}-{id}"
            });

            await db.SaveChangesAsync();
            return Results.Created($"/clientes/{id}/cuota/{cuota.Id}",
                new CuotaDto(cuota.Id, cuota.Periodo, cuota.Monto, cuota.Pagada, cuota.FechaPago,
                    cuota.MetodoPago?.ToString(), cuota.Referencia));
        }).WithTags("Cuotas");

        app.MapGet("/clientes/{id}/estado-cuenta", async (string id, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(id);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {id} no existe"));

            var cuotas = await db.Cuotas.Where(c => c.ClienteId == id).OrderBy(c => c.Periodo).ToListAsync();
            var pendientes = cuotas.Where(c => !c.Pagada)
                .Select(c => new CuotaDto(c.Id, c.Periodo, c.Monto, c.Pagada, c.FechaPago,
                    c.MetodoPago?.ToString(), c.Referencia))
                .ToList();
            var pagadas = cuotas.Where(c => c.Pagada)
                .Select(c => new CuotaDto(c.Id, c.Periodo, c.Monto, c.Pagada, c.FechaPago,
                    c.MetodoPago?.ToString(), c.Referencia))
                .ToList();
            var deuda = pendientes.Sum(c => c.Monto);

            return Results.Ok(new EstadoCuentaDto(cliente.Id, cliente.Nombre, deuda, pendientes, pagadas));
        }).WithTags("Cuotas");

        return app;
    }
}
