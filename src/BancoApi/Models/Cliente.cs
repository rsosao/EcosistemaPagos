namespace BancoApi.Models;

public class Cliente
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Dpi { get; set; } = string.Empty;

    public List<Cuenta> Cuentas { get; set; } = new();
}
