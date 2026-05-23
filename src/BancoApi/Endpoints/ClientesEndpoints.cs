using BancoApi.Data;
using BancoApi.Dtos;
using BancoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Endpoints;

public static class ClientesEndpoints
{
    public static IEndpointRouteBuilder MapClientesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/clientes").WithTags("Clientes");

        group.MapPost("/", async (CrearClienteRequest req, BancoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Nombre) || string.IsNullOrWhiteSpace(req.Dpi))
                return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "Nombre y DPI son requeridos."));

            if (await db.Clientes.AnyAsync(c => c.Dpi == req.Dpi))
                return Results.BadRequest(new ErrorResponse("DPI_DUPLICADO", "Ya existe un cliente con ese DPI."));

            var cliente = new Cliente { Nombre = req.Nombre, Dpi = req.Dpi };
            db.Clientes.Add(cliente);
            await db.SaveChangesAsync();
            return Results.Created($"/clientes/{cliente.Id}", cliente.ToDto());
        });

        group.MapGet("/{id:int}", async (int id, BancoDbContext db) =>
        {
            var cliente = await db.Clientes
                .Include(c => c.Cuentas)
                .FirstOrDefaultAsync(c => c.Id == id);
            return cliente is null
                ? Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {id} no existe."))
                : Results.Ok(cliente.ToDetalle());
        });

        return app;
    }
}
