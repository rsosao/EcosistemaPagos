using System.ComponentModel.DataAnnotations;

namespace EnergiaApi.Models;

public class ClienteServicio
{
    /// <summary>
    /// Identificador del cliente. Para EnergiaApi corresponde al número de contador (ej. "C-123456").
    /// </summary>
    [Key]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public List<Cuota> Cuotas { get; set; } = new();
}
