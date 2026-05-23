using System.Net.Http.Json;
using EnergiaApi.Models;

namespace EnergiaApi.Services;

/// <summary>
/// Cliente HTTP tipado para comunicarse con BancoApi.
/// </summary>
public class BancoClient
{
    private readonly HttpClient _http;
    private readonly ILogger<BancoClient> _logger;

    public BancoClient(HttpClient http, ILogger<BancoClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<ValidarTarjetaResponse?> ValidarTarjetaAsync(ValidarTarjetaRequest req, CancellationToken ct = default)
    {
        try
        {
            var resp = await _http.PostAsJsonAsync("/api/tarjetas/validar", req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await TryReadErrorAsync(resp, ct);
                return new ValidarTarjetaResponse(false, null, null, err?.Codigo ?? "BANCO_ERROR", err?.Mensaje ?? $"HTTP {(int)resp.StatusCode}");
            }
            return await resp.Content.ReadFromJsonAsync<ValidarTarjetaResponse>(cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invocando BancoApi /api/tarjetas/validar");
            return new ValidarTarjetaResponse(false, null, null, "BANCO_NO_DISPONIBLE", ex.Message);
        }
    }

    public async Task<ProcesarPagoResponse?> ProcesarPagoAsync(ProcesarPagoRequest req, CancellationToken ct = default)
    {
        try
        {
            var resp = await _http.PostAsJsonAsync("/api/pagos/procesar", req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await TryReadErrorAsync(resp, ct);
                return new ProcesarPagoResponse(false, err?.Codigo ?? "BANCO_ERROR", null, null, err?.Mensaje ?? $"HTTP {(int)resp.StatusCode}");
            }
            return await resp.Content.ReadFromJsonAsync<ProcesarPagoResponse>(cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invocando BancoApi /api/pagos/procesar");
            return new ProcesarPagoResponse(false, "BANCO_NO_DISPONIBLE", null, null, ex.Message);
        }
    }

    public async Task<SaldoBancoResponse?> ConsultarSaldoEmpresaAsync(string empresa, CancellationToken ct = default)
    {
        try
        {
            return await _http.GetFromJsonAsync<SaldoBancoResponse>($"/api/cuenta-empresa/{empresa}/saldo", ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error consultando saldo de la cuenta empresa {Empresa}", empresa);
            return null;
        }
    }

    private static async Task<ErrorResponse?> TryReadErrorAsync(HttpResponseMessage resp, CancellationToken ct)
    {
        try
        {
            return await resp.Content.ReadFromJsonAsync<ErrorResponse>(cancellationToken: ct);
        }
        catch
        {
            return null;
        }
    }
}
