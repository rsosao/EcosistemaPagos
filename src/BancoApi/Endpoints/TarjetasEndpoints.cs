using BancoApi.Data;
using BancoApi.Dtos;
using BancoApi.Models;
using BancoApi.Services;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Endpoints;

public static class TarjetasEndpoints
{
    public static IEndpointRouteBuilder MapTarjetasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/tarjetas").WithTags("Tarjetas");

        group.MapPost("/", async (EmitirTarjetaRequest req, BancoDbContext db) =>
        {
            var cuenta = await ResolverCuentaAsync(db, req);
            if (cuenta is null)
            {
                if (!req.CuentaId.HasValue && string.IsNullOrWhiteSpace(req.NumeroCuenta))
                    return Results.BadRequest(new ErrorResponse("DATOS_INVALIDOS",
                        "Indique cuentaId (numérico) o numeroCuenta (ej. 1000-0001)."));

                var refBusqueda = req.CuentaId?.ToString() ?? req.NumeroCuenta?.Trim();
                return Results.NotFound(new ErrorResponse("CUENTA_NO_ENCONTRADA",
                    $"Cuenta {refBusqueda} no existe."));
            }

            var numero = GenerarNumero();
            while (await db.Tarjetas.AnyAsync(t => t.Numero == numero))
                numero = GenerarNumero();

            var tarjeta = new Tarjeta
            {
                CuentaId = cuenta.Id,
                Numero = numero,
                Cvv = Random.Shared.Next(0, 1000).ToString("D3"),
                Tipo = req.Tipo,
                Activa = true,
                FechaVencimiento = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(3))
            };
            db.Tarjetas.Add(tarjeta);
            await db.SaveChangesAsync();
            return Results.Created($"/tarjetas/{tarjeta.Numero}", tarjeta.ToDto());
        });

        group.MapGet("/{numero}", async (string numero, BancoDbContext db) =>
        {
            var numeroNorm = TarjetaUtil.NormalizarNumero(numero);
            var tarjeta = await db.Tarjetas
                .Include(t => t.Cuenta)
                    .ThenInclude(c => c!.Cliente)
                .FirstOrDefaultAsync(t => t.Numero == numeroNorm);
            return tarjeta is null
                ? Results.NotFound(new ErrorResponse("TARJETA_INVALIDA",
                    $"No existe la tarjeta {numero}."))
                : Results.Ok(tarjeta.ToDto(incluirCuenta: true));
        });

        group.MapPost("/compra-pos",
            async (CompraPosRequest req, BancoDbContext db, IPagosService pagos) =>
            {
                var tarjeta = await BuscarTarjetaAsync(db, req.Numero, req.Cvv);
                if (tarjeta is null)
                    return Results.BadRequest(new ErrorResponse("TARJETA_INVALIDA",
                        "Número o CVV incorrectos."));
                if (!tarjeta.Activa)
                    return Results.BadRequest(new ErrorResponse("TARJETA_INVALIDA",
                        "La tarjeta no está activa."));
                if (tarjeta.FechaVencimiento < DateOnly.FromDateTime(DateTime.UtcNow))
                    return Results.BadRequest(new ErrorResponse("TARJETA_VENCIDA",
                        "La tarjeta está vencida."));
                if (req.Monto <= 0)
                    return Results.BadRequest(new ErrorResponse("MONTO_INVALIDO",
                        "El monto debe ser mayor a cero."));
                if (tarjeta.Cuenta is null || tarjeta.Cuenta.Saldo < req.Monto)
                    return Results.BadRequest(new ErrorResponse("SALDO_INSUFICIENTE",
                        "Saldo insuficiente."));

                tarjeta.Cuenta.Saldo -= req.Monto;
                var referencia = pagos.GenerarReferencia("POS");
                db.Movimientos.Add(new Movimiento
                {
                    CuentaId = tarjeta.CuentaId,
                    Tipo = TipoMovimiento.CompraPOS,
                    Monto = req.Monto,
                    Referencia = referencia,
                    Descripcion = $"Compra POS en {req.Comercio}"
                });
                await db.SaveChangesAsync();
                return Results.Ok(new
                {
                    codigo = "OK",
                    referencia,
                    saldo = tarjeta.Cuenta.Saldo
                });
            });

        group.MapPost("/retiro-cajero",
            async (RetiroCajeroRequest req, BancoDbContext db, IPagosService pagos) =>
            {
                var tarjeta = await BuscarTarjetaAsync(db, req.Numero, req.Cvv);
                if (tarjeta is null)
                    return Results.BadRequest(new ErrorResponse("TARJETA_INVALIDA",
                        "Número o CVV incorrectos."));
                if (!tarjeta.Activa)
                    return Results.BadRequest(new ErrorResponse("TARJETA_INVALIDA",
                        "La tarjeta no está activa."));
                if (tarjeta.FechaVencimiento < DateOnly.FromDateTime(DateTime.UtcNow))
                    return Results.BadRequest(new ErrorResponse("TARJETA_VENCIDA",
                        "La tarjeta está vencida."));
                if (req.Monto <= 0)
                    return Results.BadRequest(new ErrorResponse("MONTO_INVALIDO",
                        "El monto debe ser mayor a cero."));

                var esRed5B = string.Equals(req.Red, "5B", StringComparison.OrdinalIgnoreCase);
                var comisionExtra = esRed5B ? 0m : 5m;
                var total = req.Monto + comisionExtra;

                if (tarjeta.Cuenta is null || tarjeta.Cuenta.Saldo < total)
                    return Results.BadRequest(new ErrorResponse("SALDO_INSUFICIENTE",
                        "Saldo insuficiente para el retiro más la comisión."));

                tarjeta.Cuenta.Saldo -= total;
                var referencia = pagos.GenerarReferencia("CAJ");
                db.Movimientos.Add(new Movimiento
                {
                    CuentaId = tarjeta.CuentaId,
                    Tipo = TipoMovimiento.RetiroCajero,
                    Monto = req.Monto,
                    Referencia = referencia,
                    Descripcion = $"Retiro en cajero red {req.Red}"
                });

                if (comisionExtra > 0)
                {
                    var cuentaComi = await db.CuentaComisiones
                        .Include(c => c.Cuenta)
                        .FirstOrDefaultAsync();
                    if (cuentaComi?.Cuenta is not null)
                        cuentaComi.Cuenta.Saldo += comisionExtra;

                    db.Movimientos.Add(new Movimiento
                    {
                        CuentaId = tarjeta.CuentaId,
                        Tipo = TipoMovimiento.Comision,
                        Monto = comisionExtra,
                        Referencia = referencia,
                        Descripcion = $"Comisión Q{comisionExtra} por retiro red {req.Red} (no 5B)"
                    });

                    if (cuentaComi?.Cuenta is not null)
                    {
                        db.Movimientos.Add(new Movimiento
                        {
                            CuentaId = cuentaComi.CuentaId,
                            Tipo = TipoMovimiento.Comision,
                            Monto = comisionExtra,
                            Referencia = referencia,
                            Descripcion = $"Comisión cobrada por retiro red {req.Red}"
                        });
                    }
                }

                await db.SaveChangesAsync();
                return Results.Ok(new
                {
                    codigo = "OK",
                    referencia,
                    saldo = tarjeta.Cuenta.Saldo,
                    comisionExtra
                });
            });

        return app;
    }

    private static async Task<Tarjeta?> BuscarTarjetaAsync(BancoDbContext db, string numero, string cvv)
    {
        var numeroNorm = TarjetaUtil.NormalizarNumero(numero);
        var cvvNorm = TarjetaUtil.NormalizarCvv(cvv);
        return await db.Tarjetas
            .Include(t => t.Cuenta)
            .FirstOrDefaultAsync(t => t.Numero == numeroNorm && t.Cvv == cvvNorm);
    }

    private static async Task<Cuenta?> ResolverCuentaAsync(BancoDbContext db, EmitirTarjetaRequest req)
    {
        if (req.CuentaId is > 0)
            return await db.Cuentas.FindAsync(req.CuentaId.Value);

        if (!string.IsNullOrWhiteSpace(req.NumeroCuenta))
            return await db.Cuentas.FirstOrDefaultAsync(c => c.NumeroCuenta == req.NumeroCuenta.Trim());

        return null;
    }

    private static string GenerarNumero()
    {
        var rnd = Random.Shared;
        return $"4{rnd.NextInt64(100000000000000, 999999999999999)}";
    }
}
