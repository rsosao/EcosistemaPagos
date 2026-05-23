namespace EnergiaApi.Models;

// ---------- Respuesta de error común ----------
public record ErrorResponse(string Codigo, string Mensaje);

// ---------- Clientes ----------
public record CrearClienteRequest(string IdCliente, string Nombre);
public record ActualizarClienteRequest(string Nombre);
public record ClienteResponse(string IdCliente, string Nombre, DateTime FechaRegistro);

// ---------- Cuotas ----------
public record GenerarCuotasRequest(string Periodo, decimal Monto);
public record AgregarCuotaRequest(string Periodo, decimal Monto);
public record CuotaDetalle(int Id, string Periodo, decimal Monto, bool Pagada, DateTime? FechaPago, string? MetodoPago, string? Referencia);

public record EstadoCuentaResponse(
    string IdCliente,
    string Nombre,
    decimal TotalPendiente,
    decimal TotalPagado,
    List<CuotaDetalle> Cuotas);

// ---------- Pagos (Flujo C - efectivo) ----------
public record PagoEfectivoRequest(string IdCliente, decimal Monto, string? Referencia);
public record PagoEfectivoResponse(string Codigo, string Referencia, decimal MontoAplicado, decimal SaldoPendiente);

// ---------- Pagos (Flujo B - tarjeta) ----------
public record PagoTarjetaRequest(string IdCliente, string Numero, string Cvv);
public record PagoTarjetaResponse(
    bool Autorizado,
    string Codigo,
    string? ReferenciaBancaria,
    decimal MontoCobrado,
    decimal? ComisionRetenida,
    string? Mensaje);

// ---------- API pública (consumida por el banco) ----------
public record DeudaDetalleItem(string Periodo, decimal Monto);
public record DeudaResponse(string IdCliente, string Nombre, decimal Total, List<DeudaDetalleItem> Detalle);

public record ConfirmarPagoRequest(string IdCliente, decimal Monto, string Referencia, string Metodo);
public record ConfirmarPagoResponse(string Codigo, string Mensaje, decimal SaldoFinal);

// ---------- Tesorería ----------
public record MovimientoBancoItem(string Tipo, decimal Monto, DateTime Fecha, string? Referencia);
public record SaldoBancoResponse(string Empresa, decimal Saldo, List<MovimientoBancoItem> UltimosMovimientos);

// ---------- Reportes ----------
public record ClientePendienteItem(string IdCliente, string Nombre, decimal TotalPendiente, int CuotasPendientes);
public record ClientePagadoItem(string IdCliente, string Nombre, string Periodo, DateTime? FechaPago);
public record MovimientoReporteItem(int Id, string Tipo, decimal Monto, DateTime Fecha, string? ClienteId, string? Referencia);
public record ComprobanteResponse(
    string Referencia,
    string IdCliente,
    string NombreCliente,
    string Periodo,
    decimal Monto,
    string MetodoPago,
    DateTime FechaPago);

// ---------- Banco (DTOs para HttpClient) ----------
public record ValidarTarjetaRequest(string Numero, string Cvv);
public record ValidarTarjetaResponse(bool Valida, string? Tipo, string? Titular, string? Codigo, string? Mensaje);

public record ProcesarPagoRequest(string Numero, string Cvv, decimal Monto, string Empresa, string Referencia);
public record ProcesarPagoResponse(
    bool Autorizado,
    string Codigo,
    string? ReferenciaBancaria,
    decimal? ComisionRetenida,
    string? Mensaje);
