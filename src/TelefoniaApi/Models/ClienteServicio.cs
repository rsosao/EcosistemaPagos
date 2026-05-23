using System.ComponentModel.DataAnnotations;

namespace TelefoniaApi.Models;

public class ClienteServicio
{
    [Key]
    [MaxLength(32)]
    public string Id { get; set; } = string.Empty;

    [MaxLength(160)]
    public string Nombre { get; set; } = string.Empty;

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public List<Cuota> Cuotas { get; set; } = new();
}
