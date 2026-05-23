using System.ComponentModel.DataAnnotations;

namespace TelefoniaApi.Models;

public class Cuota
{
    [Key]
    public int Id { get; set; }

    [MaxLength(32)]
    public string ClienteId { get; set; } = string.Empty;

    [MaxLength(16)]
    public string Periodo { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public bool Pagada { get; set; }

    public DateTime? FechaPago { get; set; }

    public MetodoPago? MetodoPago { get; set; }

    [MaxLength(64)]
    public string? Referencia { get; set; }

    public ClienteServicio? Cliente { get; set; }
}
