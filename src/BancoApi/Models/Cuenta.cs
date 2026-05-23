namespace BancoApi.Models;

public enum TipoCuenta
{
    Corriente = 0,
    Monetaria = 1,
    Transitoria = 2
}

public class Cuenta
{
    public int Id { get; set; }
    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public string NumeroCuenta { get; set; } = string.Empty;
    public decimal Saldo { get; set; }
    public TipoCuenta Tipo { get; set; }

    public List<Movimiento> Movimientos { get; set; } = new();
    public List<Tarjeta> Tarjetas { get; set; } = new();
}
