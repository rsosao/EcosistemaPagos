using Microsoft.EntityFrameworkCore;
using TelefoniaApi.Data;
using TelefoniaApi.Models;
using TelefoniaApi.Services;

namespace TelefoniaApi.Endpoints;

public static class SeedEndpoints
{
    public static IEndpointRouteBuilder MapSeed(this IEndpointRouteBuilder app)
    {
        app.MapPost("/seed", async (AppDbContext db) =>
        {
            if (await db.Clientes.AnyAsync())
                return Results.Ok(new { codigo = "YA_INICIALIZADO", mensaje = "La base ya contiene clientes." });

            var clientes = new[]
            {
                new ClienteServicio { Id = "55551234", Nombre = "Juan Pérez", FechaRegistro = DateTime.UtcNow },
                new ClienteServicio { Id = "55555678", Nombre = "María López", FechaRegistro = DateTime.UtcNow }
            };
            db.Clientes.AddRange(clientes);

            var periodo = DateTime.UtcNow.ToString("yyyy-MM");
            decimal monto = 250m;
            foreach (var c in clientes)
            {
                db.Cuotas.Add(new Cuota
                {
                    ClienteId = c.Id,
                    Periodo = periodo,
                    Monto = monto,
                    Pagada = false
                });
                db.Movimientos.Add(new MovimientoEmpresa
                {
                    Tipo = TipoMovimientoEmpresa.CuotaGenerada,
                    Monto = monto,
                    Fecha = DateTime.UtcNow,
                    ClienteId = c.Id
                });
            }

            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                codigo = "OK",
                mensaje = "Datos semilla creados.",
                clientes = clientes.Select(c => new { c.Id, c.Nombre }),
                periodo,
                cuotaMensual = monto
            });
        }).WithTags("Seed");

        return app;
    }
}
