using BancoApi.Data;
using BancoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Services;

public interface ISeedService
{
    Task<object> EjecutarAsync(CancellationToken ct = default);
}

public class SeedService : ISeedService
{
    private readonly BancoDbContext _db;

    public SeedService(BancoDbContext db) { _db = db; }

    public async Task<object> EjecutarAsync(CancellationToken ct = default)
    {
        if (await _db.Clientes.AnyAsync(ct))
        {
            return new
            {
                codigo = "YA_SEMBRADO",
                mensaje = "La base de datos ya contiene datos semilla."
            };
        }

        var cliente1 = new Cliente { Nombre = "Ana López", Dpi = "1990012340101" };
        var cliente2 = new Cliente { Nombre = "Luis Pérez", Dpi = "1985056780202" };
        _db.Clientes.AddRange(cliente1, cliente2);
        await _db.SaveChangesAsync(ct);

        var cuenta1 = new Cuenta
        {
            ClienteId = cliente1.Id,
            NumeroCuenta = "1000-0001",
            Saldo = 5000m,
            Tipo = TipoCuenta.Corriente
        };
        var cuenta2 = new Cuenta
        {
            ClienteId = cliente2.Id,
            NumeroCuenta = "1000-0002",
            Saldo = 5000m,
            Tipo = TipoCuenta.Corriente
        };
        _db.Cuentas.AddRange(cuenta1, cuenta2);
        await _db.SaveChangesAsync(ct);

        var vencimiento = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(3));
        var tarjeta1 = new Tarjeta
        {
            CuentaId = cuenta1.Id,
            Numero = "4111111111110001",
            Cvv = "123",
            Tipo = TipoTarjeta.Debito,
            Activa = true,
            FechaVencimiento = vencimiento
        };
        var tarjeta2 = new Tarjeta
        {
            CuentaId = cuenta2.Id,
            Numero = "4111111111110002",
            Cvv = "456",
            Tipo = TipoTarjeta.Debito,
            Activa = true,
            FechaVencimiento = vencimiento
        };
        _db.Tarjetas.AddRange(tarjeta1, tarjeta2);

        var cuentaUni = new Cuenta
        {
            NumeroCuenta = "9000-0001",
            Saldo = 0m,
            Tipo = TipoCuenta.Transitoria
        };
        var cuentaTel = new Cuenta
        {
            NumeroCuenta = "9000-0002",
            Saldo = 0m,
            Tipo = TipoCuenta.Transitoria
        };
        var cuentaEne = new Cuenta
        {
            NumeroCuenta = "9000-0003",
            Saldo = 0m,
            Tipo = TipoCuenta.Transitoria
        };
        var cuentaComi = new Cuenta
        {
            NumeroCuenta = "9999-0000",
            Saldo = 0m,
            Tipo = TipoCuenta.Corriente
        };
        _db.Cuentas.AddRange(cuentaUni, cuentaTel, cuentaEne, cuentaComi);
        await _db.SaveChangesAsync(ct);

        _db.CuentasEmpresa.AddRange(
            new CuentaEmpresa { Nombre = "Universidad", CuentaId = cuentaUni.Id },
            new CuentaEmpresa { Nombre = "Telefonia", CuentaId = cuentaTel.Id },
            new CuentaEmpresa { Nombre = "Energia", CuentaId = cuentaEne.Id });

        _db.CuentaComisiones.Add(new CuentaComisiones { CuentaId = cuentaComi.Id });
        await _db.SaveChangesAsync(ct);

        return new
        {
            codigo = "OK",
            mensaje = "Datos semilla creados.",
            clientes = new[]
            {
                new { id = cliente1.Id, cuenta = cuenta1.NumeroCuenta, tarjeta = tarjeta1.Numero, cvv = tarjeta1.Cvv },
                new { id = cliente2.Id, cuenta = cuenta2.NumeroCuenta, tarjeta = tarjeta2.Numero, cvv = tarjeta2.Cvv }
            },
            cuentasEmpresa = new[] { "Universidad", "Telefonia", "Energia" },
            cuentaComisiones = cuentaComi.NumeroCuenta
        };
    }
}
