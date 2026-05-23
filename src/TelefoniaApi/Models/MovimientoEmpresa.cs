using System.ComponentModel.DataAnnotations;

namespace TelefoniaApi.Models;

public class MovimientoEmpresa
{
    [Key]
    public int Id { get; set; }

    public TipoMovimientoEmpresa Tipo { get; set; }

    public decimal Monto { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [MaxLength(32)]
    public string ClienteId { get; set; } = string.Empty;

    [MaxLength(64)]
    public string? Referencia { get; set; }
}
