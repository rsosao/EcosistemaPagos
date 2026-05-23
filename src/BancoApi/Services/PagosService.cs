using BancoApi.Data;
using BancoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Services;

public record ResultadoPago(
    bool Exito,
    string Codigo,
    string? Mensaje,
    string? Referencia,
    decimal Comision,
    decimal Acreditado);

public interface IPagosService
{
    Task<ResultadoPago> DebitarYAcreditarAsync(
        Cuenta cuentaOrigen,
        decimal monto,
        string empresaNombre,
        TipoMovimiento tipoMovimientoOrigen,
        string descripcionOrigen,
        string? referenciaExterna,
        CancellationToken ct = default);

    string GenerarReferencia(string prefijo);
}

public class PagosService : IPagosService
{
    private readonly BancoDbContext _db;
    private readonly IConfiguration _config;

    public PagosService(BancoDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public string GenerarReferencia(string prefijo) =>
        $"{prefijo}-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}";

    public async Task<ResultadoPago> DebitarYAcreditarAsync(
        Cuenta cuentaOrigen,
        decimal monto,
        string empresaNombre,
        TipoMovimiento tipoMovimientoOrigen,
        string descripcionOrigen,
        string? referenciaExterna,
        CancellationToken ct = default)
    {
        if (monto <= 0)
            return new ResultadoPago(false, "MONTO_INVALIDO", "El monto debe ser mayor a cero.", null, 0, 0);

        if (cuentaOrigen.Saldo < monto)
            return new ResultadoPago(false, "SALDO_INSUFICIENTE", "Saldo insuficiente.", null, 0, 0);

        var cuentaEmpresa = await _db.CuentasEmpresa
            .Include(c => c.Cuenta)
            .FirstOrDefaultAsync(c => c.Nombre == empresaNombre, ct);
        if (cuentaEmpresa is null || cuentaEmpresa.Cuenta is null)
            return new ResultadoPago(false, "EMPRESA_DESCONOCIDA",
                $"No existe cuenta transitoria para '{empresaNombre}'.", null, 0, 0);

        var cuentaComisiones = await _db.CuentaComisiones
            .Include(c => c.Cuenta)
            .FirstOrDefaultAsync(ct);
        if (cuentaComisiones is null || cuentaComisiones.Cuenta is null)
            return new ResultadoPago(false, "CUENTA_NO_ENCONTRADA",
                "La cuenta de comisiones del banco no está configurada.", null, 0, 0);

        var porcentajeComision = _config.GetValue<decimal?>("Comision") ?? 0.05m;
        var comision = Math.Round(monto * porcentajeComision, 2, MidpointRounding.AwayFromZero);
        var acreditado = monto - comision;
        var referencia = referenciaExterna is { Length: > 0 }
            ? referenciaExterna
            : GenerarReferencia("BNK");

        cuentaOrigen.Saldo -= monto;
        cuentaEmpresa.Cuenta.Saldo += acreditado;
        cuentaComisiones.Cuenta.Saldo += comision;

        var fecha = DateTime.UtcNow;

        _db.Movimientos.Add(new Movimiento
        {
            CuentaId = cuentaOrigen.Id,
            Tipo = tipoMovimientoOrigen,
            Monto = monto,
            Fecha = fecha,
            Referencia = referencia,
            Descripcion = descripcionOrigen
        });

        _db.Movimientos.Add(new Movimiento
        {
            CuentaId = cuentaEmpresa.CuentaId,
            Tipo = TipoMovimiento.AcreditacionServicio,
            Monto = acreditado,
            Fecha = fecha,
            Referencia = referencia,
            Descripcion = $"Acreditación 95% de pago a {empresaNombre}"
        });

        _db.Movimientos.Add(new Movimiento
        {
            CuentaId = cuentaComisiones.CuentaId,
            Tipo = TipoMovimiento.Comision,
            Monto = comision,
            Fecha = fecha,
            Referencia = referencia,
            Descripcion = $"Comisión 5% por pago a {empresaNombre}"
        });

        await _db.SaveChangesAsync(ct);

        return new ResultadoPago(true, "OK", null, referencia, comision, acreditado);
    }
}
