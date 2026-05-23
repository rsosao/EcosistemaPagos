using Microsoft.EntityFrameworkCore;
using UniversidadApi.Data;
using UniversidadApi.Dtos;
using UniversidadApi.Models;

namespace UniversidadApi.Endpoints;

public static class ApiPublicaEndpoints
{
    public static IEndpointRouteBuilder MapApiPublicaEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api").WithTags("API Pública (Banco)");

        grupo.MapGet("/deuda/{idCliente}", async (string idCliente, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(idCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {idCliente} no existe"));

            var pendientes = await db.Cuotas
                .Where(c => c.ClienteId == idCliente && !c.Pagada)
                .OrderBy(c => c.Periodo)
                .ToListAsync();

            var detalle = pendientes
                .Select(c => new DetalleDeudaDto(c.Periodo, c.Monto))
                .ToList();
            var total = detalle.Sum(d => d.Monto);

            return Results.Ok(new DeudaDto(cliente.Id, cliente.Nombre, total, detalle));
        });

        grupo.MapPost("/pagos/confirmar", async (ConfirmarPagoDto dto, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(dto.IdCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {dto.IdCliente} no existe"));

            if (string.IsNullOrWhiteSpace(dto.Referencia))
                return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "La referencia es obligatoria"));

            if (!Enum.TryParse<MetodoPago>(dto.Metodo, true, out var metodo))
                metodo = MetodoPago.BancaVirtual;

            var pendientes = await db.Cuotas
                .Where(c => c.ClienteId == dto.IdCliente && !c.Pagada)
                .OrderBy(c => c.Periodo)
                .ToListAsync();

            if (pendientes.Count == 0)
                return Results.Ok(new { codigo = "SIN_DEUDA", mensaje = "El cliente ya estaba al día" });

            var ahora = DateTime.UtcNow;
            var periodos = new List<string>();
            foreach (var cuota in pendientes)
            {
                cuota.Pagada = true;
                cuota.FechaPago = ahora;
                cuota.MetodoPago = metodo;
                cuota.Referencia = dto.Referencia;
                periodos.Add(cuota.Periodo);
            }

            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimiento.PagoRecibido,
                Monto = pendientes.Sum(c => c.Monto),
                Fecha = ahora,
                ClienteId = dto.IdCliente,
                Referencia = dto.Referencia
            });

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                codigo = "OK",
                idCliente = dto.IdCliente,
                referencia = dto.Referencia,
                metodo = metodo.ToString(),
                periodosPagados = periodos
            });
        });

        return app;
    }
}
