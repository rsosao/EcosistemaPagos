using System.ComponentModel.DataAnnotations;

namespace UniversidadApi.Models;

public enum MetodoPago
{
    Efectivo = 0,
    Tarjeta = 1,
    BancaVirtual = 2
}

public class Cuota
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string ClienteId { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Periodo { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public bool Pagada { get; set; }

    public DateTime? FechaPago { get; set; }

    public MetodoPago? MetodoPago { get; set; }

    [MaxLength(100)]
    public string? Referencia { get; set; }

    public ClienteServicio? Cliente { get; set; }
}
