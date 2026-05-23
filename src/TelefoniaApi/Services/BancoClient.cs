using System.Net.Http.Json;

namespace TelefoniaApi.Services;

public class BancoClient
{
    private readonly HttpClient _http;
    private readonly ILogger<BancoClient> _logger;

    public BancoClient(HttpClient http, ILogger<BancoClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<BancoValidarTarjetaResponse?> ValidarTarjetaAsync(BancoValidarTarjetaRequest req, CancellationToken ct = default)
    {
        try
        {
            var resp = await _http.PostAsJsonAsync("/api/tarjetas/validar", req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadFromJsonAsync<ErrorResponse>(cancellationToken: ct);
                return new BancoValidarTarjetaResponse(false, null, null, err?.codigo ?? "ERROR_BANCO", err?.mensaje ?? "Error consultando banco");
            }
            return await resp.Content.ReadFromJsonAsync<BancoValidarTarjetaResponse>(cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validando tarjeta contra BancoApi");
            return new BancoValidarTarjetaResponse(false, null, null, "BANCO_INACCESIBLE", ex.Message);
        }
    }

    public async Task<BancoProcesarPagoResponse?> ProcesarPagoAsync(BancoProcesarPagoRequest req, CancellationToken ct = default)
    {
        try
        {
            var resp = await _http.PostAsJsonAsync("/api/pagos/procesar", req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadFromJsonAsync<ErrorResponse>(cancellationToken: ct);
                return new BancoProcesarPagoResponse(false, err?.codigo ?? "ERROR_BANCO", err?.mensaje ?? "Error procesando pago", null, null);
            }
            return await resp.Content.ReadFromJsonAsync<BancoProcesarPagoResponse>(cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando pago contra BancoApi");
            return new BancoProcesarPagoResponse(false, "BANCO_INACCESIBLE", ex.Message, null, null);
        }
    }

    public async Task<SaldoBancarioResponse?> ConsultarSaldoEmpresaAsync(string empresa, CancellationToken ct = default)
    {
        try
        {
            return await _http.GetFromJsonAsync<SaldoBancarioResponse>($"/api/cuenta-empresa/{empresa}/saldo", ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error consultando saldo en BancoApi");
            return null;
        }
    }
}
