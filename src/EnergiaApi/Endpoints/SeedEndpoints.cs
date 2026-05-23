using EnergiaApi.Data;
using EnergiaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Endpoints;

public static class SeedEndpoints
{
    public static IEndpointRouteBuilder MapSeedEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/seed", async (EnergiaDbContext db) =>
        {
            var clientesPredef = new[]
            {
                ("C-100001", "Hogar Pérez"),
                ("C-100002", "Empresa Luz del Sur")
            };

            var creados = new List<string>();
            foreach (var (id, nombre) in clientesPredef)
            {
                if (!await db.Clientes.AnyAsync(c => c.Id == id))
                {
                    db.Clientes.Add(new ClienteServicio { Id = id, Nombre = nombre, FechaRegistro = DateTime.UtcNow });
                    creados.Add(id);
                }
            }
            await db.SaveChangesAsync();

            var periodo = DateTime.UtcNow.ToString("yyyy-MM");
            const decimal montoMensual = 300m;
            var cuotasGeneradas = 0;
            foreach (var (id, _) in clientesPredef)
            {
                var existe = await db.Cuotas.AnyAsync(c => c.ClienteId == id && c.Periodo == periodo);
                if (!existe)
                {
                    db.Cuotas.Add(new Cuota
                    {
                        ClienteId = id,
                        Periodo = periodo,
                        Monto = montoMensual,
                        Pagada = false
                    });
                    db.Movimientos.Add(new MovimientoEmpresa
                    {
                        Tipo = TipoMovimientoEmpresa.CuotaGenerada,
                        Monto = montoMensual,
                        Fecha = DateTime.UtcNow,
                        ClienteId = id,
                        Referencia = $"seed-{periodo}"
                    });
                    cuotasGeneradas++;
                }
            }
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                clientesCreados = creados,
                cuotasGeneradas,
                periodo,
                montoMensual
            });
        })
        .WithTags("Seed")
        .WithSummary("Crea 2 clientes con número de contador y una cuota mensual de Q300 cada uno.");

        return app;
    }
}
