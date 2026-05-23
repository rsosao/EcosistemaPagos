using Microsoft.EntityFrameworkCore;
using UniversidadApi.Data;
using UniversidadApi.Dtos;
using UniversidadApi.Models;
using UniversidadApi.Services;

namespace UniversidadApi.Endpoints;

public static class PagosEndpoints
{
    public static IEndpointRouteBuilder MapPagosEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/pagar").WithTags("Pagos");

        grupo.MapPost("/efectivo", async (PagoEfectivoDto dto, AppDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(dto.IdCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {dto.IdCliente} no existe"));

            if (dto.Monto <= 0)
                return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "El monto debe ser mayor a 0"));

            var pendientes = await db.Cuotas
                .Where(c => c.ClienteId == dto.IdCliente && !c.Pagada)
                .OrderBy(c => c.Periodo)
                .ToListAsync();

            if (pendientes.Count == 0)
                return Results.BadRequest(new ErrorResponse("SIN_DEUDA", "El cliente no tiene cuotas pendientes"));

            var totalDeuda = pendientes.Sum(c => c.Monto);
            if (dto.Monto < totalDeuda)
                return Results.BadRequest(new ErrorResponse("MONTO_INSUFICIENTE",
                    $"Se requieren Q{totalDeuda} para liquidar todas las cuotas pendientes"));

            var referencia = string.IsNullOrWhiteSpace(dto.Referencia)
                ? $"EFE-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}"
                : dto.Referencia!;
            var ahora = DateTime.UtcNow;
            var periodos = new List<string>();

            foreach (var cuota in pendientes)
            {
                cuota.Pagada = true;
                cuota.FechaPago = ahora;
                cuota.MetodoPago = MetodoPago.Efectivo;
                cuota.Referencia = referencia;
                periodos.Add(cuota.Periodo);
            }

            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimiento.PagoRecibido,
                Monto = totalDeuda,
                Fecha = ahora,
                ClienteId = dto.IdCliente,
                Referencia = referencia
            });

            await db.SaveChangesAsync();

            return Results.Ok(new ComprobanteDto(
                referencia, cliente.Id, cliente.Nombre, totalDeuda,
                MetodoPago.Efectivo.ToString(), ahora, periodos));
        });

        grupo.MapPost("/tarjeta", async (PagoTarjetaDto dto, AppDbContext db, BancoClient banco, IConfiguration cfg) =>
        {
            var cliente = await db.Clientes.FindAsync(dto.IdCliente);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO", $"Cliente {dto.IdCliente} no existe"));

            if (string.IsNullOrWhiteSpace(dto.Numero) || string.IsNullOrWhiteSpace(dto.Cvv))
                return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS", "Número y CVV son obligatorios"));

            var pendientes = await db.Cuotas
                .Where(c => c.ClienteId == dto.IdCliente && !c.Pagada)
                .OrderBy(c => c.Periodo)
                .ToListAsync();

            if (pendientes.Count == 0)
                return Results.BadRequest(new ErrorResponse("SIN_DEUDA", "El cliente no tiene cuotas pendientes"));

            var totalDeuda = pendientes.Sum(c => c.Monto);

            var validacion = await banco.ValidarTarjetaAsync(dto.Numero, dto.Cvv);
            if (validacion is null || !validacion.valida)
                return Results.BadRequest(new ErrorResponse(
                    validacion?.codigo ?? "TARJETA_INVALIDA",
                    validacion?.mensaje ?? "Tarjeta no válida"));

            var empresa = cfg["EmpresaNombre"] ?? "Universidad";
            var refLocal = $"TAR-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

            var proceso = await banco.ProcesarPagoAsync(new PagoProcesarDto(
                dto.Numero, dto.Cvv, totalDeuda, empresa, refLocal));

            if (proceso is null || !proceso.autorizado)
                return Results.BadRequest(new ErrorResponse(
                    proceso?.codigo ?? "PAGO_RECHAZADO",
                    proceso?.mensaje ?? "El pago no fue autorizado por el banco"));

            var referenciaFinal = proceso.referenciaBancaria ?? refLocal;
            var ahora = DateTime.UtcNow;
            var periodos = new List<string>();

            foreach (var cuota in pendientes)
            {
                cuota.Pagada = true;
                cuota.FechaPago = ahora;
                cuota.MetodoPago = MetodoPago.Tarjeta;
                cuota.Referencia = referenciaFinal;
                periodos.Add(cuota.Periodo);
            }

            db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimiento.PagoRecibido,
                Monto = totalDeuda,
                Fecha = ahora,
                ClienteId = dto.IdCliente,
                Referencia = referenciaFinal
            });

            await db.SaveChangesAsync();

            return Results.Ok(new ComprobanteDto(
                referenciaFinal, cliente.Id, cliente.Nombre, totalDeuda,
                MetodoPago.Tarjeta.ToString(), ahora, periodos));
        });

        return app;
    }
}
