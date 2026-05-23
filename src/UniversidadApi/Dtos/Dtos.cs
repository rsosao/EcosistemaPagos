using UniversidadApi.Models;

namespace UniversidadApi.Dtos;

public record ErrorResponse(string codigo, string mensaje);

public record ClienteCreateDto(string Carne, string Nombre);
public record ClienteUpdateDto(string Nombre);

public record ClienteDto(string Carne, string Nombre, DateTime FechaRegistro);

public record CuotaManualDto(string Periodo, decimal Monto);
public record GenerarCuotasDto(string Periodo, decimal Monto);

public record CuotaDto(int Id, string Periodo, decimal Monto, bool Pagada, DateTime? FechaPago, string? MetodoPago, string? Referencia);

public record DetalleDeudaDto(string Periodo, decimal Monto);
public record DeudaDto(string IdCliente, string Nombre, decimal Total, List<DetalleDeudaDto> Detalle);

public record EstadoCuentaDto(
    string IdCliente,
    string Nombre,
    decimal DeudaTotal,
    List<CuotaDto> CuotasPendientes,
    List<CuotaDto> CuotasPagadas);

public record PagoEfectivoDto(string IdCliente, decimal Monto, string? Referencia);
public record PagoTarjetaDto(string IdCliente, string Numero, string Cvv);

public record ConfirmarPagoDto(string IdCliente, decimal Monto, string Referencia, string Metodo);

public record ComprobanteDto(
    string Referencia,
    string IdCliente,
    string NombreCliente,
    decimal Monto,
    string Metodo,
    DateTime Fecha,
    List<string> Periodos);

public record MovimientoDto(int Id, string Tipo, decimal Monto, DateTime Fecha, string ClienteId, string? Referencia);

public record ClientePendienteDto(string Carne, string Nombre, decimal Deuda, int CuotasPendientes);
public record ClientePagadoDto(string Carne, string Nombre, string Periodo, DateTime? FechaPago, string? Metodo);

public record SaldoBancoDto(string empresa, decimal saldo, List<object> ultimosMovimientos);

public record TarjetaValidarDto(string numero, string cvv);
public record TarjetaValidarResponse(bool valida, string? tipo, string? titular, string? codigo, string? mensaje);

public record PagoProcesarDto(string numero, string cvv, decimal monto, string empresa, string referencia);
public record PagoProcesarResponse(bool autorizado, string? codigo, string? referenciaBancaria, decimal comisionRetenida, string? mensaje);

public record PagoTarjetaResultado(bool autorizado, string? codigo, string? referencia, decimal monto, string? mensaje);
