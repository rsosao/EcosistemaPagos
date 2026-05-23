namespace BancoApi.Models;

public enum TipoMovimiento
{
    Deposito = 0,
    Retiro = 1,
    CompraPOS = 2,
    RetiroCajero = 3,
    PagoServicio = 4,
    Comision = 5,
    AcreditacionServicio = 6
}

public class Movimiento
{
    public int Id { get; set; }
    public int CuentaId { get; set; }
    public Cuenta? Cuenta { get; set; }

    public TipoMovimiento Tipo { get; set; }
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public string Referencia { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
}
