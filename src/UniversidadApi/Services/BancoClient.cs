using System.Net.Http.Json;
using UniversidadApi.Dtos;

namespace UniversidadApi.Services;

public class BancoClient
{
    private readonly HttpClient _http;
    private readonly ILogger<BancoClient> _logger;

    public BancoClient(HttpClient http, ILogger<BancoClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<TarjetaValidarResponse?> ValidarTarjetaAsync(string numero, string cvv, CancellationToken ct = default)
    {
        try
        {
            var resp = await _http.PostAsJsonAsync("/api/tarjetas/validar", new TarjetaValidarDto(numero, cvv), ct);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadFromJsonAsync<ErrorResponse>(cancellationToken: ct);
                return new TarjetaValidarResponse(false, null, null, err?.codigo ?? "BANCO_ERROR", err?.mensaje ?? $"HTTP {(int)resp.StatusCode}");
            }
            return await resp.Content.ReadFromJsonAsync<TarjetaValidarResponse>(cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al validar tarjeta en BancoApi");
            return new TarjetaValidarResponse(false, null, null, "BANCO_NO_DISPONIBLE", ex.Message);
        }
    }

    public async Task<PagoProcesarResponse?> ProcesarPagoAsync(PagoProcesarDto dto, CancellationToken ct = default)
    {
        try
        {
            var resp = await _http.PostAsJsonAsync("/api/pagos/procesar", dto, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadFromJsonAsync<ErrorResponse>(cancellationToken: ct);
                return new PagoProcesarResponse(false, err?.codigo ?? "BANCO_ERROR", null, 0m, err?.mensaje ?? $"HTTP {(int)resp.StatusCode}");
            }
            return await resp.Content.ReadFromJsonAsync<PagoProcesarResponse>(cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al procesar pago en BancoApi");
            return new PagoProcesarResponse(false, "BANCO_NO_DISPONIBLE", null, 0m, ex.Message);
        }
    }

    public async Task<HttpResponseMessage> GetSaldoEmpresaAsync(string empresa, CancellationToken ct = default)
    {
        return await _http.GetAsync($"/api/cuenta-empresa/{empresa}/saldo", ct);
    }
}
