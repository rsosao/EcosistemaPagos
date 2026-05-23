using System.ComponentModel.DataAnnotations;

namespace EnergiaApi.Models;

public class MovimientoEmpresa
{
    public int Id { get; set; }

    public TipoMovimientoEmpresa Tipo { get; set; }

    public decimal Monto { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string? ClienteId { get; set; }

    [MaxLength(100)]
    public string? Referencia { get; set; }
}
