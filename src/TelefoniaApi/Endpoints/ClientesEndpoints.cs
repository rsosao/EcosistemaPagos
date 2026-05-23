using Microsoft.EntityFrameworkCore;
using TelefoniaApi.Data;
using TelefoniaApi.Models;
using TelefoniaApi.Services;

namespace TelefoniaApi.Endpoints;

public static class ClientesEndpoints
{
    public static IEndpointRouteBuilder MapClientes(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/clientes").WithTags("Clientes");

        grupo.MapPost("/", async (CrearClienteRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.IdCliente))
                return Results.BadRequest(new ErrorResponse("ID_REQUERIDO", "El número telefónico es obligatorio."));
            if (string.IsNullOrWhiteSpace(req.Nombre))
                return Results.BadRequest(new ErrorResponse("NOMBRE_REQUERIDO", "El nombre es obligatorio."));

            var existe = await db.Clientes.AnyAsync(c => c.Id == req.IdCliente);
            if (existe)
                return Results.Conflict(new ErrorResponse("CLIENTE_DUPLICADO", "Ya existe un cliente con ese número telefónico."));

            var cliente = new ClienteServicio
            {
                Id = req.IdCliente,
                Nombre = req.Nombre,
                FechaRegistro = DateTime.UtcNow
            };
            db.Clientes.Add(cliente);
            await db.SaveChangesAsync();
            return Results.Created($"/clientes/{cliente.Id}", cliente.ToDto());
        });

        grupo.MapPut("/{id}", async (string id, ActualizarClienteRequest req, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(id);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));
            cliente.Nombre = req.Nombre;
            await db.SaveChangesAsync();
            return Results.Ok(cliente.ToDto());
        });

        grupo.MapGet("/{id}", async (string id, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(id);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));
            return Results.Ok(cliente.ToDto());
        });

        grupo.MapPost("/{id}/cuota", async (string id, CuotaManualRequest req, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(id);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));
            if (req.Monto <= 0)
                return Results.BadRequest(new ErrorResponse("MONTO_INVALIDO", "El monto debe ser mayor a 0."));

            var cuota = new Cuota
            {
                ClienteId = id,
                Periodo = req.Periodo,
                Monto = req.Monto,
                Pagada = false
            };
            db.Cuotas.Add(cuota);
            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimientoEmpresa.CuotaGenerada,
                Monto = req.Monto,
                Fecha = DateTime.UtcNow,
                ClienteId = id
            });
            await db.SaveChangesAsync();
            return Results.Created($"/clientes/{id}/cuota/{cuota.Id}", cuota.ToDetalle());
        });

        grupo.MapGet("/{id}/estado-cuenta", async (string id, AppDbContext db) =>
        {
            var cliente = await db.Clientes
                .Include(c => c.Cuotas)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));

            var cuotas = cliente.Cuotas
                .OrderBy(c => c.Periodo)
                .Select(c => c.ToDetalle())
                .ToList();

            var pendiente = cliente.Cuotas.Where(c => !c.Pagada).Sum(c => c.Monto);
            return Results.Ok(new EstadoCuentaResponse(cliente.Id, cliente.Nombre, pendiente, cuotas));
        });

        app.MapPost("/generar-cuotas", async (GenerarCuotasRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Periodo))
                return Results.BadRequest(new ErrorResponse("PERIODO_REQUERIDO", "El periodo es obligatorio."));
            if (req.Monto <= 0)
                return Results.BadRequest(new ErrorResponse("MONTO_INVALIDO", "El monto debe ser mayor a 0."));

            var clientes = await db.Clientes.ToListAsync();
            var existentes = await db.Cuotas
                .Where(c => c.Periodo == req.Periodo)
                .Select(c => c.ClienteId)
                .ToListAsync();
            var existentesSet = existentes.ToHashSet();

            int generadas = 0;
            foreach (var cliente in clientes)
            {
                if (existentesSet.Contains(cliente.Id)) continue;
                db.Cuotas.Add(new Cuota
                {
                    ClienteId = cliente.Id,
                    Periodo = req.Periodo,
                    Monto = req.Monto,
                    Pagada = false
                });
                db.Movimientos.Add(new MovimientoEmpresa
                {
                    Tipo = TipoMovimientoEmpresa.CuotaGenerada,
                    Monto = req.Monto,
                    Fecha = DateTime.UtcNow,
                    ClienteId = cliente.Id
                });
                generadas++;
            }
            await db.SaveChangesAsync();
            return Results.Ok(new { periodo = req.Periodo, monto = req.Monto, cuotasGeneradas = generadas, clientes = clientes.Count });
        })
        .WithTags("Cuotas");

        return app;
    }
}
