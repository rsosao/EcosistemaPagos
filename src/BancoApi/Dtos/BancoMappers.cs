using BancoApi.Models;

namespace BancoApi.Dtos;

internal static class BancoMappers
{
    public static ClienteDto ToDto(this Cliente c) =>
        new(c.Id, c.Nombre, c.Dpi);

    public static CuentaResumenDto ToResumen(this Cuenta c) =>
        new(c.Id, c.NumeroCuenta, c.Saldo, (int)c.Tipo);

    public static CuentaDto ToDto(this Cuenta c, bool incluirCliente = false) =>
        new(
            c.Id,
            c.ClienteId,
            c.NumeroCuenta,
            c.Saldo,
            (int)c.Tipo,
            incluirCliente && c.Cliente is not null ? c.Cliente.ToDto() : null);

    public static MovimientoDto ToDto(this Movimiento m) =>
        new(
            m.Id,
            m.CuentaId,
            m.Tipo.ToString(),
            m.Monto,
            m.Fecha,
            m.Referencia,
            m.Descripcion);

    public static TarjetaDto ToDto(this Tarjeta t, bool incluirCuenta = false) =>
        new(
            t.Id,
            t.CuentaId,
            t.Numero,
            t.Cvv,
            (int)t.Tipo,
            t.Activa,
            t.FechaVencimiento.ToString("yyyy-MM-dd"),
            incluirCuenta && t.Cuenta is not null ? t.Cuenta.ToDto(incluirCliente: true) : null);

    public static ClienteDetalleDto ToDetalle(this Cliente c) =>
        new(c.Id, c.Nombre, c.Dpi, c.Cuentas.Select(x => x.ToResumen()).ToList());
}
