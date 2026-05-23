using Microsoft.EntityFrameworkCore;
using UniversidadApi.Data;
using UniversidadApi.Dtos;
using UniversidadApi.Models;

namespace UniversidadApi.Endpoints;

public static class ClientesEndpoints
{
    public static IEndpointRouteBuilder MapClientesEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/clientes").WithTags("Clientes");

        grupo.MapPost("/", async (ClienteCreateDto dto, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Carne) || string.IsNullOrWhiteSpace(dto.Nombre))
                return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "Carné y nombre son obligatorios"));

            if (await db.Clientes.AnyAsync(c => c.Id == dto.Carne))
                return Results.Conflict(new ErrorResponse("CLIENTE_DUPLICADO", $"Ya existe un cliente con carné {dto.Carne}"));

            var cliente = new ClienteServicio
            {
                Id = dto.Carne,
                Nombre = dto.Nombre,
                FechaRegistro = DateTime.UtcNow
            };

            db.Clientes.Add(cliente);
            await db.SaveChangesAsync();

            return Results.Created($"/clientes/{cliente.Id}",
                new ClienteDto(cliente.Id, cliente.Nombre, cliente.FechaRegistro));
        });

        grupo.MapPut("/{id}", async (string id, ClienteUpdateDto dto, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(id);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {id} no existe"));

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "El nombre es obligatorio"));

            cliente.Nombre = dto.Nombre;
            await db.SaveChangesAsync();

            return Results.Ok(new ClienteDto(cliente.Id, cliente.Nombre, cliente.FechaRegistro));
        });

        grupo.MapGet("/{id}", async (string id, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(id);
            return cliente is null
                ? Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {id} no existe"))
                : Results.Ok(new ClienteDto(cliente.Id, cliente.Nombre, cliente.FechaRegistro));
        });

        return app;
    }
}
