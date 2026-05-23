using Microsoft.EntityFrameworkCore;
using UniversidadApi.Data;
using UniversidadApi.Models;

namespace UniversidadApi.Endpoints;

public static class SeedEndpoint
{
    public static IEndpointRouteBuilder MapSeedEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/seed", async (AppDbContext db) =>
        {
            var estudiantes = new[]
            {
                new ClienteServicio { Id = "0901-22-1234", Nombre = "Juan Pérez", FechaRegistro = DateTime.UtcNow },
                new ClienteServicio { Id = "0901-22-5678", Nombre = "María López", FechaRegistro = DateTime.UtcNow }
            };

            var creados = new List<string>();
            foreach (var est in estudiantes)
            {
                if (!await db.Clientes.AnyAsync(c => c.Id == est.Id))
                {
                    db.Clientes.Add(est);
                    creados.Add(est.Id);
                }
            }

            var periodo = DateTime.UtcNow.ToString("yyyy-MM");
            var monto = 500m;
            var cuotasGeneradas = 0;

            foreach (var est in estudiantes)
            {
                var existe = await db.Cuotas.AnyAsync(c => c.ClienteId == est.Id && c.Periodo == periodo);
                if (existe) continue;

                db.Cuotas.Add(new Cuota
                {
                    ClienteId = est.Id,
                    Periodo = periodo,
                    Monto = monto,
                    Pagada = false
                });
                db.Movimientos.Add(new MovimientoEmpresa
                {
                    Tipo = TipoMovimiento.CuotaGenerada,
                    Monto = monto,
                    Fecha = DateTime.UtcNow,
                    ClienteId = est.Id,
                    Referencia = $"CUOTA-{periodo}-{est.Id}"
                });
                cuotasGeneradas++;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                clientesCreados = creados,
                cuotasGeneradas,
                periodo,
                monto
            });
        }).WithTags("Seed");

        return app;
    }
}
