using BancoApi.Data;
using BancoApi.Dtos;
using BancoApi.Models;
using BancoApi.Services;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Endpoints;

public static class CuentasEndpoints
{
    public static IEndpointRouteBuilder MapCuentasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/cuentas").WithTags("Cuentas");

        group.MapPost("/", async (AbrirCuentaRequest req, BancoDbContext db) =>
        {
            var cliente = await db.Clientes.FindAsync(req.ClienteId);
            if (cliente is null)
                return Results.NotFound(new ErrorResponse("CLIENTE_NO_ENCONTRADO",
                    $"Cliente {req.ClienteId} no existe."));
            if (req.SaldoInicial < 0)
                return Results.BadRequest(new ErrorResponse("MONTO_INVALIDO",
                    "El saldo inicial no puede ser negativo."));

            var numero = GenerarNumeroCuenta(req.Tipo);
            while (await db.Cuentas.AnyAsync(c => c.NumeroCuenta == numero))
                numero = GenerarNumeroCuenta(req.Tipo);

            var cuenta = new Cuenta
            {
                ClienteId = req.ClienteId,
                NumeroCuenta = numero,
                Saldo = req.SaldoInicial,
                Tipo = req.Tipo
            };
            db.Cuentas.Add(cuenta);
            await db.SaveChangesAsync();
            return Results.Created($"/cuentas/{cuenta.Id}", cuenta.ToDto());
        });

        group.MapGet("/", async (BancoDbContext db) =>
        {
            var cuentas = await db.Cuentas
                .Include(c => c.Cliente)
                .OrderBy(c => c.Id)
                .ToListAsync();
            return Results.Ok(cuentas.Select(c => c.ToDto(incluirCliente: true)).ToList());
        });

        group.MapGet("/numero/{numeroCuenta}", async (string numeroCuenta, BancoDbContext db) =>
        {
            var cuenta = await db.Cuentas
                .Include(c => c.Cliente)
                .FirstOrDefaultAsync(c => c.NumeroCuenta == numeroCuenta);
            return cuenta is null
                ? Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                    $"No existe cuenta con número {numeroCuenta}."))
                : Results.Ok(cuenta.ToDto(incluirCliente: true));
        });

        group.MapGet("/{id:int}", async (int id, BancoDbContext db) =>
        {
            var cuenta = await db.Cuentas
                .Include(c => c.Cliente)
                .FirstOrDefaultAsync(c => c.Id == id);
            return cuenta is null
                ? Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA", $"Cuenta {id} no existe."))
                : Results.Ok(cuenta.ToDto(incluirCliente: true));
        });

        group.MapPost("/{id:int}/deposito",
            async (int id, MontoRequest req, BancoDbContext db, IPagosService pagos) =>
            {
                if (req.Monto <= 0)
                    return Results.BadRequest(new ErrorResponse("MONTO_INVALIDO",
                        "El monto debe ser mayor a cero."));

                var cuenta = await db.Cuentas.FindAsync(id);
                if (cuenta is null)
                    return Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                        $"Cuenta {id} no existe."));

                cuenta.Saldo += req.Monto;
                var referencia = pagos.GenerarReferencia("DEP");
                db.Movimientos.Add(new Movimiento
                {
                    CuentaId = cuenta.Id,
                    Tipo = TipoMovimiento.Deposito,
                    Monto = req.Monto,
                    Referencia = referencia,
                    Descripcion = req.Descripcion ?? "Depósito en ventanilla"
                });
                await db.SaveChangesAsync();
                return Results.Ok(new { codigo = "OK", referencia, saldo = cuenta.Saldo });
            });

        group.MapPost("/{id:int}/retiro",
            async (int id, MontoRequest req, BancoDbContext db, IPagosService pagos) =>
            {
                if (req.Monto <= 0)
                    return Results.BadRequest(new ErrorResponse("MONTO_INVALIDO",
                        "El monto debe ser mayor a cero."));

                var cuenta = await db.Cuentas.FindAsync(id);
                if (cuenta is null)
                    return Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                        $"Cuenta {id} no existe."));
                if (cuenta.Saldo < req.Monto)
                    return Results.BadRequest(new ErrorResponse("SALDO_INSUFICIENTE",
                        "La cuenta no tiene saldo suficiente."));

                cuenta.Saldo -= req.Monto;
                var referencia = pagos.GenerarReferencia("RET");
                db.Movimientos.Add(new Movimiento
                {
                    CuentaId = cuenta.Id,
                    Tipo = TipoMovimiento.Retiro,
                    Monto = req.Monto,
                    Referencia = referencia,
                    Descripcion = req.Descripcion ?? "Retiro en ventanilla"
                });
                await db.SaveChangesAsync();
                return Results.Ok(new { codigo = "OK", referencia, saldo = cuenta.Saldo });
            });

        group.MapGet("/{id:int}/movimientos", async (int id, BancoDbContext db) =>
        {
            var existe = await db.Cuentas.AnyAsync(c => c.Id == id);
            if (!existe)
                return Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                    $"Cuenta {id} no existe."));

            var movs = await db.Movimientos
                .Where(m => m.CuentaId == id)
                .OrderByDescending(m => m.Fecha)
                .ToListAsync();

            return Results.Ok(movs.Select(m => m.ToDto()).ToList());
        });

        return app;
    }

    private static string GenerarNumeroCuenta(TipoCuenta tipo) =>
        $"{(int)tipo + 1}000-{Random.Shared.Next(1000, 9999)}";
}
