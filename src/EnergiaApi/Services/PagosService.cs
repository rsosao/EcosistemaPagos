using EnergiaApi.Data;
using EnergiaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Services;

/// <summary>
/// Lógica compartida para aplicar pagos sobre las cuotas pendientes de un cliente.
/// </summary>
public class PagosService
{
    private readonly EnergiaDbContext _db;

    public PagosService(EnergiaDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Aplica un pago sobre las cuotas pendientes del cliente, en orden cronológico por periodo.
    /// Devuelve el monto realmente aplicado (puede ser menor si el cliente no debía tanto) y el saldo restante.
    /// Registra además un MovimientoEmpresa PagoRecibido.
    /// </summary>
    public async Task<(decimal MontoAplicado, decimal SaldoPendiente, List<Cuota> CuotasAfectadas)> AplicarPagoAsync(
        string clienteId,
        decimal monto,
        MetodoPago metodo,
        string referencia,
        CancellationToken ct = default)
    {
        var pendientes = await _db.Cuotas
            .Where(c => c.ClienteId == clienteId && !c.Pagada)
            .OrderBy(c => c.Periodo)
            .ToListAsync(ct);

        var restante = monto;
        var afectadas = new List<Cuota>();

        foreach (var cuota in pendientes)
        {
            if (restante <= 0) break;
            if (restante >= cuota.Monto)
            {
                cuota.Pagada = true;
                cuota.FechaPago = DateTime.UtcNow;
                cuota.MetodoPago = metodo;
                cuota.Referencia = referencia;
                restante -= cuota.Monto;
                afectadas.Add(cuota);
            }
            else
            {
                // Pago parcial: en este modelo simple no aceptamos pagos parciales sobre una cuota; cortamos.
                break;
            }
        }

        var aplicado = monto - restante;

        if (aplicado > 0)
        {
            _db.Movimientos.Add(new MovimientoEmpresa
            {
                Tipo = TipoMovimientoEmpresa.PagoRecibido,
                Monto = aplicado,
                Fecha = DateTime.UtcNow,
                ClienteId = clienteId,
                Referencia = referencia
            });
        }

        await _db.SaveChangesAsync(ct);

        var saldoPendiente = await _db.Cuotas
            .Where(c => c.ClienteId == clienteId && !c.Pagada)
            .SumAsync(c => (decimal?)c.Monto, ct) ?? 0m;

        return (aplicado, saldoPendiente, afectadas);
    }

    public async Task<decimal> CalcularDeudaAsync(string clienteId, CancellationToken ct = default)
    {
        return await _db.Cuotas
            .Where(c => c.ClienteId == clienteId && !c.Pagada)
            .SumAsync(c => (decimal?)c.Monto, ct) ?? 0m;
    }
}
