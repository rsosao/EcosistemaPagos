namespace BancoApi.Models;

public enum TipoTarjeta
{
    Debito = 0,
    Credito = 1
}

public class Tarjeta
{
    public int Id { get; set; }
    public int CuentaId { get; set; }
    public Cuenta? Cuenta { get; set; }

    public string Numero { get; set; } = string.Empty;
    public string Cvv { get; set; } = string.Empty;
    public TipoTarjeta Tipo { get; set; }
    public bool Activa { get; set; } = true;
    public DateOnly FechaVencimiento { get; set; }
}
