using TelefoniaApi.Models;

namespace TelefoniaApi.Services;

internal static class EmpresaMappers
{
    public static ClienteResponse ToDto(this ClienteServicio c) =>
        new(c.Id, c.Nombre, c.FechaRegistro);

    public static CuotaDetalle ToDetalle(this Cuota c) =>
        new(
            c.Id,
            c.Periodo,
            c.Monto,
            c.Pagada,
            c.FechaPago,
            c.MetodoPago.HasValue ? c.MetodoPago.Value.ToString() : null,
            c.Referencia);
}
