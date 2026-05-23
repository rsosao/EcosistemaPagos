namespace BancoApi.Models;

public class CuentaComisiones
{
    public int Id { get; set; }
    public int CuentaId { get; set; }
    public Cuenta? Cuenta { get; set; }
}
