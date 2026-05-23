using EnergiaApi.Data;
using EnergiaApi.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Endpoints;

public static class CuotasEndpoints
{
    public static IEndpointRouteBuilder MapCuotasEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/generar-cuotas",
            async Task<Results<Ok<object>, BadRequest<ErrorResponse>>>
            (GenerarCuotasRequest req, EnergiaDbContext db) =>
            {
                if (string.IsNullOrWhiteSpace(req.Periodo) || req.Monto <= 0)
                {
                    return TypedResults.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "Periodo y Monto > 0 son obligatorios."));
                }

                var clientes = await db.Clientes.ToListAsync();
                if (clientes.Count == 0)
                {
                    return TypedResults.Ok<object>(new { generadas = 0, mensaje = "No hay clientes registrados." });
                }

                var generadas = 0;
                foreach (var cliente in clientes)
                {
                    var existe = await db.Cuotas.AnyAsync(c => c.ClienteId == cliente.Id && c.Periodo == req.Periodo);
                    if (existe) continue;

                    db.Cuotas.Add(new Cuota
                    {
                        ClienteId = cliente.Id,
                        Periodo = req.Periodo.Trim(),
                        Monto = req.Monto,
                        Pagada = false
                    });
                    db.Movimientos.Add(new MovimientoEmpresa
                    {
                        Tipo = TipoMovimientoEmpresa.CuotaGenerada,
                        Monto = req.Monto,
                        Fecha = DateTime.UtcNow,
                        ClienteId = cliente.Id,
                        Referencia = $"corte-{req.Periodo}"
                    });
                    generadas++;
                }
                await db.SaveChangesAsync();

                return TypedResults.Ok<object>(new { generadas, periodo = req.Periodo, monto = req.Monto });
            })
            .WithTags("Cuotas")
            .WithSummary("Genera la cuota del periodo para todos los clientes (emula corte mensual).");

        return app;
    }
}
