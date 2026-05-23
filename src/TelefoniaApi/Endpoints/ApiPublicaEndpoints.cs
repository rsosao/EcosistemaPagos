using Microsoft.EntityFrameworkCore;
using TelefoniaApi.Data;
using TelefoniaApi.Models;
using TelefoniaApi.Services;

namespace TelefoniaApi.Endpoints;

public static class ApiPublicaEndpoints
{
    public static IEndpointRouteBuilder MapApiPublica(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api").WithTags("API Pública (Banco)");

        grupo.MapGet("/deuda/{idCliente}", async (string idCliente, AppDbContext db) =>
        {
            var cliente = await db.Clientes
                .Include(c => c.Cuotas)
                .FirstOrDefaultAsync(c => c.Id == idCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));

            var pendientes = cliente.Cuotas
                .Where(c => !c.Pagada)
                .OrderBy(c => c.Periodo)
                .Select(c => new DetalleDeudaItem(c.Id, c.Periodo, c.Monto))
                .ToList();
            var total = pendientes.Sum(c => c.Monto);
            return Results.Ok(new DeudaPublicaResponse(cliente.Id, cliente.Nombre, total, pendientes));
        });

        grupo.MapPost("/pagos/confirmar", async (ConfirmarPagoRequest req, AppDbContext db) =>
        {
            var cliente = await db.Clientes
                .Include(c => c.Cuotas)
                .FirstOrDefaultAsync(c => c.Id == req.IdCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));

            if (!Enum.TryParse<MetodoPago>(req.Metodo, ignoreCase: true, out var metodo))
                metodo = MetodoPago.BancaVirtual;

            var pendientes = cliente.Cuotas.Where(c => !c.Pagada).OrderBy(c => c.Periodo).ToList();
            if (pendientes.Count == 0)
                return Results.Ok(new { codigo = "SIN_DEUDA", mensaje = "Cliente sin cuotas pendientes." });

            var fecha = DateTime.UtcNow;
            foreach (var c in pendientes)
            {
                c.Pagada = true;
                c.FechaPago = fecha;
                c.MetodoPago = metodo;
                c.Referencia = req.Referencia;
            }

            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimientoEmpresa.PagoRecibido,
                Monto = req.Monto,
                Fecha = fecha,
                ClienteId = cliente.Id,
                Referencia = req.Referencia
            });

            await db.SaveChangesAsync();
            return Results.Ok(new { codigo = "OK", mensaje = "Pago confirmado.", referencia = req.Referencia });
        });

        return app;
    }
}
