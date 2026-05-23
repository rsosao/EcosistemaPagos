using System.ComponentModel.DataAnnotations;

namespace UniversidadApi.Models;

public enum TipoMovimiento
{
    CuotaGenerada = 0,
    PagoRecibido = 1
}

public class MovimientoEmpresa
{
    public int Id { get; set; }

    public TipoMovimiento Tipo { get; set; }

    public decimal Monto { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string ClienteId { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Referencia { get; set; }
}
