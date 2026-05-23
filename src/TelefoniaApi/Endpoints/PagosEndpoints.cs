using Microsoft.EntityFrameworkCore;
using TelefoniaApi.Data;
using TelefoniaApi.Models;
using TelefoniaApi.Services;

namespace TelefoniaApi.Endpoints;

public static class PagosEndpoints
{
    public static IEndpointRouteBuilder MapPagos(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/pagar").WithTags("Pagos");

        grupo.MapPost("/efectivo", async (PagoEfectivoRequest req, AppDbContext db) =>
        {
            var cliente = await db.Clientes
                .Include(c => c.Cuotas)
                .FirstOrDefaultAsync(c => c.Id == req.IdCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));

            var pendientes = cliente.Cuotas.Where(c => !c.Pagada).OrderBy(c => c.Periodo).ToList();
            if (pendientes.Count == 0)
                return Results.BadRequest(new ErrorResponse("SIN_DEUDA", "El cliente no tiene cuotas pendientes."));

            var totalDeuda = pendientes.Sum(c => c.Monto);
            if (req.Monto < totalDeuda)
                return Results.BadRequest(new ErrorResponse("MONTO_INSUFICIENTE", $"Para liquidar la deuda se requiere Q{totalDeuda:F2}."));

            var referencia = req.Referencia ?? $"EF-{Guid.NewGuid():N}"[..16];
            var fecha = DateTime.UtcNow;
            var pagadas = new List<CuotaDetalle>();
            foreach (var c in pendientes)
            {
                c.Pagada = true;
                c.FechaPago = fecha;
                c.MetodoPago = MetodoPago.Efectivo;
                c.Referencia = referencia;
                pagadas.Add(new CuotaDetalle(c.Id, c.Periodo, c.Monto, true, fecha, MetodoPago.Efectivo.ToString(), referencia));
            }

            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimientoEmpresa.PagoRecibido,
                Monto = totalDeuda,
                Fecha = fecha,
                ClienteId = cliente.Id,
                Referencia = referencia
            });
            await db.SaveChangesAsync();

            return Results.Ok(new PagoResponse(
                Autorizado: true,
                Codigo: "OK",
                Mensaje: "Pago en efectivo registrado.",
                Referencia: referencia,
                MontoCobrado: totalDeuda,
                ComisionRetenida: null,
                Metodo: MetodoPago.Efectivo.ToString()
            ));
        });

        grupo.MapPost("/tarjeta", async (PagoTarjetaRequest req, AppDbContext db, BancoClient banco, IConfiguration cfg) =>
        {
            var cliente = await db.Clientes
                .Include(c => c.Cuotas)
                .FirstOrDefaultAsync(c => c.Id == req.IdCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado."));

            var pendientes = cliente.Cuotas.Where(c => !c.Pagada).OrderBy(c => c.Periodo).ToList();
            if (pendientes.Count == 0)
                return Results.BadRequest(new ErrorResponse("SIN_DEUDA", "El cliente no tiene cuotas pendientes."));

            var totalDeuda = pendientes.Sum(c => c.Monto);
            var empresa = cfg["EmpresaNombre"] ?? "Telefonia";
            var referencia = $"TJ-{Guid.NewGuid():N}"[..16];

            var validacion = await banco.ValidarTarjetaAsync(new BancoValidarTarjetaRequest(req.Numero, req.Cvv));
            if (validacion is null || !validacion.Valida)
            {
                return Results.BadRequest(new ErrorResponse(
                    validacion?.Codigo ?? "TARJETA_INVALIDA",
                    validacion?.Mensaje ?? "Tarjeta inválida."));
            }

            var resultado = await banco.ProcesarPagoAsync(new BancoProcesarPagoRequest(
                req.Numero, req.Cvv, totalDeuda, empresa, referencia));
            if (resultado is null || !resultado.Autorizado)
            {
                return Results.BadRequest(new ErrorResponse(
                    resultado?.Codigo ?? "PAGO_RECHAZADO",
                    resultado?.Mensaje ?? "El banco rechazó el pago."));
            }

            var refBancaria = resultado.ReferenciaBancaria ?? referencia;
            var fecha = DateTime.UtcNow;
            foreach (var c in pendientes)
            {
                c.Pagada = true;
                c.FechaPago = fecha;
                c.MetodoPago = MetodoPago.Tarjeta;
                c.Referencia = refBancaria;
            }
            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimientoEmpresa.PagoRecibido,
                Monto = totalDeuda,
                Fecha = fecha,
                ClienteId = cliente.Id,
                Referencia = refBancaria
            });
            await db.SaveChangesAsync();

            return Results.Ok(new PagoResponse(
                Autorizado: true,
                Codigo: "OK",
                Mensaje: "Pago con tarjeta autorizado.",
                Referencia: refBancaria,
                MontoCobrado: totalDeuda,
                ComisionRetenida: resultado.ComisionRetenida,
                Metodo: MetodoPago.Tarjeta.ToString()
            ));
        });

        return app;
    }
}
