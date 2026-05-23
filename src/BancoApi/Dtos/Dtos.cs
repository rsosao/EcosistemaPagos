using BancoApi.Models;

namespace BancoApi.Dtos;

public record ErrorResponse(string Codigo, string Mensaje);

public record CrearClienteRequest(string Nombre, string Dpi);

public record ClienteDto(int Id, string Nombre, string Dpi);

public record CuentaResumenDto(int Id, string NumeroCuenta, decimal Saldo, int Tipo);

public record ClienteDetalleDto(int Id, string Nombre, string Dpi, List<CuentaResumenDto> Cuentas);

public record CuentaDto(
    int Id,
    int? ClienteId,
    string NumeroCuenta,
    decimal Saldo,
    int Tipo,
    ClienteDto? Cliente);

public record MovimientoDto(
    int Id,
    int CuentaId,
    string Tipo,
    decimal Monto,
    DateTime Fecha,
    string Referencia,
    string Descripcion);

public record TarjetaDto(
    int Id,
    int CuentaId,
    string Numero,
    string Cvv,
    int Tipo,
    bool Activa,
    string FechaVencimiento,
    CuentaDto? Cuenta);

public record AbrirCuentaRequest(int ClienteId, TipoCuenta Tipo, decimal SaldoInicial);

public record MontoRequest(decimal Monto, string? Descripcion);

public record EmitirTarjetaRequest(int? CuentaId, string? NumeroCuenta, TipoTarjeta Tipo);

public record CompraPosRequest(string Numero, string Cvv, decimal Monto, string Comercio);

public record RetiroCajeroRequest(string Numero, string Cvv, decimal Monto, string Red);

public record PagoServicioRequest(string Servicio, string IdClienteServicio, int IdCuentaBanco);

public record ValidarTarjetaRequest(string Numero, string Cvv);

public record ValidarTarjetaResponse(bool Valida, string? Tipo, string? Titular, string? Codigo, string? Mensaje);

public record PagoProcesarRequest(string Numero, string Cvv, decimal Monto, string Empresa, string Referencia);

public record PagoProcesarResponse(
    bool Autorizado,
    string Codigo,
    string? Mensaje,
    string? ReferenciaBancaria,
    decimal? ComisionRetenida);

public record DeudaDetalle(string Periodo, decimal Monto);

public record DeudaResponse(string IdCliente, string Nombre, decimal Total, List<DeudaDetalle> Detalle);

public record PagoConfirmarRequest(string IdCliente, decimal Monto, string Referencia, string Metodo);

public record CuentaEmpresaSaldoResponse(
    string Empresa,
    decimal Saldo,
    List<MovimientoResumen> UltimosMovimientos);

public record MovimientoResumen(
    int Id,
    string Tipo,
    decimal Monto,
    DateTime Fecha,
    string Referencia,
    string Descripcion);

public record ComprobanteResponse(
    string Referencia,
    DateTime Fecha,
    string Empresa,
    decimal MontoTotal,
    decimal Comision,
    decimal Acreditado,
    string CuentaOrigen,
    string CuentaDestino);
