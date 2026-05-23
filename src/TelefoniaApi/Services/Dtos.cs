namespace TelefoniaApi.Services;

public record ErrorResponse(string codigo, string mensaje);

public record CrearClienteRequest(string IdCliente, string Nombre);
public record ActualizarClienteRequest(string Nombre);
public record ClienteResponse(string IdCliente, string Nombre, DateTime FechaRegistro);
public record GenerarCuotasRequest(string Periodo, decimal Monto);
public record CuotaManualRequest(string Periodo, decimal Monto);

public record DetalleDeudaItem(int CuotaId, string Periodo, decimal Monto);
public record DeudaPublicaResponse(string IdCliente, string Nombre, decimal Total, List<DetalleDeudaItem> Detalle);

public record PagoEfectivoRequest(string IdCliente, decimal Monto, string? Referencia);
public record PagoTarjetaRequest(string IdCliente, string Numero, string Cvv);

public record ConfirmarPagoRequest(string IdCliente, decimal Monto, string Referencia, string Metodo);

public record PagoResponse(
    bool Autorizado,
    string Codigo,
    string Mensaje,
    string? Referencia,
    decimal MontoCobrado,
    decimal? ComisionRetenida,
    string Metodo
);

public record SaldoBancarioResponse(string Empresa, decimal Saldo, List<UltimoMovimientoBanco> UltimosMovimientos);
public record UltimoMovimientoBanco(string Tipo, decimal Monto, DateTime Fecha, string? Referencia, string? Descripcion);

public record ClientePendienteResponse(string IdCliente, string Nombre, decimal TotalPendiente, int CuotasPendientes);
public record ClientePagadoResponse(string IdCliente, string Nombre, string Periodo, decimal Monto, DateTime? FechaPago);
public record EstadoCuentaResponse(string IdCliente, string Nombre, decimal Pendiente, List<CuotaDetalle> Cuotas);
public record CuotaDetalle(int Id, string Periodo, decimal Monto, bool Pagada, DateTime? FechaPago, string? MetodoPago, string? Referencia);
public record MovimientoResponse(int Id, string Tipo, decimal Monto, DateTime Fecha, string ClienteId, string? Referencia);
public record ComprobanteResponse(string Referencia, string IdCliente, string Nombre, decimal Monto, string Metodo, DateTime Fecha, List<CuotaDetalle> CuotasPagadas);

public record BancoValidarTarjetaRequest(string Numero, string Cvv);
public record BancoValidarTarjetaResponse(bool Valida, string? Tipo, string? Titular, string? Codigo, string? Mensaje);

public record BancoProcesarPagoRequest(string Numero, string Cvv, decimal Monto, string Empresa, string Referencia);
public record BancoProcesarPagoResponse(
    bool Autorizado,
    string? Codigo,
    string? Mensaje,
    string? ReferenciaBancaria,
    decimal? ComisionRetenida
);
