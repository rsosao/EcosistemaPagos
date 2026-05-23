namespace BancoApi.Models;

public class CuentaEmpresa
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int CuentaId { get; set; }
    public Cuenta? Cuenta { get; set; }
}
