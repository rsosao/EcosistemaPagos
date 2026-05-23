using System.ComponentModel.DataAnnotations;

namespace UniversidadApi.Models;

public class ClienteServicio
{
    [Key]
    [MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public List<Cuota> Cuotas { get; set; } = new();
}
