using EnergiaApi.Data;
using EnergiaApi.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Endpoints;

public static class ClientesEndpoints
{
    public static IEndpointRouteBuilder MapClientesEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/clientes").WithTags("Clientes");

        grupo.MapPost("/", async Task<Results<Created<ClienteResponse>, Conflict<ErrorResponse>, BadRequest<ErrorResponse>>>
            (CrearClienteRequest req, EnergiaDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.IdCliente) || string.IsNullOrWhiteSpace(req.Nombre))
            {
                return TypedResults.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "IdCliente y Nombre son obligatorios."));
            }

            if (await db.Clientes.AnyAsync(c => c.Id == req.IdCliente))
            {
                return TypedResults.Conflict(new ErrorResponse("CLIENTE_DUPLICADO", $"Ya existe un cliente con contador {req.IdCliente}."));
            }

            var cliente = new ClienteServicio
            {
                Id = req.IdCliente.Trim(),
                Nombre = req.Nombre.Trim(),
                FechaRegistro = DateTime.UtcNow
            };
            db.Clientes.Add(cliente);
            await db.SaveChangesAsync();

            var resp = new ClienteResponse(cliente.Id, cliente.Nombre, cliente.FechaRegistro);
            return TypedResults.Created($"/clientes/{cliente.Id}", resp);
        })
        .WithSummary("Registra un nuevo cliente (número de contador como Id).");

        grupo.MapGet("/{id}", async Task<Results<Ok<ClienteResponse>, NotFound<ErrorResponse>>>
            (string id, EnergiaDbContext db) =>
        {
            var c = await db.Clientes.FindAsync(id);
            if (c is null)
                return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"No existe cliente con contador {id}."));
            return TypedResults.Ok(new ClienteResponse(c.Id, c.Nombre, c.FechaRegistro));
        })
        .WithSummary("Consulta los datos de un cliente por número de contador.");

        grupo.MapPut("/{id}", async Task<Results<Ok<ClienteResponse>, NotFound<ErrorResponse>, BadRequest<ErrorResponse>>>
            (string id, ActualizarClienteRequest req, EnergiaDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Nombre))
                return TypedResults.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "Nombre es obligatorio."));

            var c = await db.Clientes.FindAsync(id);
            if (c is null)
                return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"No existe cliente con contador {id}."));

            c.Nombre = req.Nombre.Trim();
            await db.SaveChangesAsync();
            return TypedResults.Ok(new ClienteResponse(c.Id, c.Nombre, c.FechaRegistro));
        })
        .WithSummary("Actualiza el nombre de un cliente.");

        grupo.MapPost("/{id}/cuota", async Task<Results<Created<CuotaDetalle>, NotFound<ErrorResponse>, BadRequest<ErrorResponse>>>
            (string id, AgregarCuotaRequest req, EnergiaDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Periodo) || req.Monto <= 0)
                return TypedResults.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "Periodo y Monto > 0 son obligatorios."));

            var existe = await db.Clientes.AnyAsync(c => c.Id == id);
            if (!existe)
                return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"No existe cliente con contador {id}."));

            var cuota = new Cuota
            {
                ClienteId = id,
                Periodo = req.Periodo.Trim(),
                Monto = req.Monto,
                Pagada = false
            };
            db.Cuotas.Add(cuota);
            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimientoEmpresa.CuotaGenerada,
                Monto = req.Monto,
                Fecha = DateTime.UtcNow,
                ClienteId = id,
                Referencia = $"manual-{id}-{req.Periodo}"
            });
            await db.SaveChangesAsync();

            return TypedResults.Created($"/clientes/{id}/estado-cuenta",
                new CuotaDetalle(cuota.Id, cuota.Periodo, cuota.Monto, cuota.Pagada, cuota.FechaPago, cuota.MetodoPago?.ToString(), cuota.Referencia));
        })
        .WithSummary("Agrega una cuota manual a un cliente.");

        grupo.MapGet("/{id}/estado-cuenta", async Task<Results<Ok<EstadoCuentaResponse>, NotFound<ErrorResponse>>>
            (string id, EnergiaDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(id);
            if (cliente is null)
                return TypedResults.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"No existe cliente con contador {id}."));

            var cuotas = await db.Cuotas
                .Where(c => c.ClienteId == id)
                .OrderBy(c => c.Periodo)
                .ToListAsync();

            var detalle = cuotas.Select(c => new CuotaDetalle(
                c.Id, c.Periodo, c.Monto, c.Pagada, c.FechaPago, c.MetodoPago?.ToString(), c.Referencia)).ToList();

            var totalPendiente = cuotas.Where(c => !c.Pagada).Sum(c => c.Monto);
            var totalPagado = cuotas.Where(c => c.Pagada).Sum(c => c.Monto);

            return TypedResults.Ok(new EstadoCuentaResponse(cliente.Id, cliente.Nombre, totalPendiente, totalPagado, detalle));
        })
        .WithSummary("Estado de cuenta del cliente: cuotas pagadas y pendientes.");

        return app;
    }
}
