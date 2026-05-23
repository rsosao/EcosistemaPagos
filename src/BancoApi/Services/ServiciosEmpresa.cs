using BancoApi.Dtos;

namespace BancoApi.Services;

public interface IServicioEmpresaClient
{
    string Nombre { get; }
    Task<DeudaResponse?> ObtenerDeudaAsync(string idCliente, CancellationToken ct = default);
    Task<bool> ConfirmarPagoAsync(PagoConfirmarRequest request, CancellationToken ct = default);
}

public class UniversidadClient : IServicioEmpresaClient
{
    private readonly HttpClient _http;
    public UniversidadClient(HttpClient http) { _http = http; }
    public string Nombre => "Universidad";

    public Task<DeudaResponse?> ObtenerDeudaAsync(string idCliente, CancellationToken ct = default) =>
        _http.GetFromJsonAsync<DeudaResponse>($"/api/deuda/{idCliente}", ct);

    public async Task<bool> ConfirmarPagoAsync(PagoConfirmarRequest request, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("/api/pagos/confirmar", request, ct);
        return resp.IsSuccessStatusCode;
    }
}

public class TelefoniaClient : IServicioEmpresaClient
{
    private readonly HttpClient _http;
    public TelefoniaClient(HttpClient http) { _http = http; }
    public string Nombre => "Telefonia";

    public Task<DeudaResponse?> ObtenerDeudaAsync(string idCliente, CancellationToken ct = default) =>
        _http.GetFromJsonAsync<DeudaResponse>($"/api/deuda/{idCliente}", ct);

    public async Task<bool> ConfirmarPagoAsync(PagoConfirmarRequest request, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("/api/pagos/confirmar", request, ct);
        return resp.IsSuccessStatusCode;
    }
}

public class EnergiaClient : IServicioEmpresaClient
{
    private readonly HttpClient _http;
    public EnergiaClient(HttpClient http) { _http = http; }
    public string Nombre => "Energia";

    public Task<DeudaResponse?> ObtenerDeudaAsync(string idCliente, CancellationToken ct = default) =>
        _http.GetFromJsonAsync<DeudaResponse>($"/api/deuda/{idCliente}", ct);

    public async Task<bool> ConfirmarPagoAsync(PagoConfirmarRequest request, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("/api/pagos/confirmar", request, ct);
        return resp.IsSuccessStatusCode;
    }
}

public interface IServiciosEmpresaResolver
{
    IServicioEmpresaClient? Resolver(string nombre);
    string? NormalizarNombre(string nombre);
}

public class ServiciosEmpresaResolver : IServiciosEmpresaResolver
{
    private readonly UniversidadClient _uni;
    private readonly TelefoniaClient _tel;
    private readonly EnergiaClient _ene;

    public ServiciosEmpresaResolver(UniversidadClient uni, TelefoniaClient tel, EnergiaClient ene)
    {
        _uni = uni;
        _tel = tel;
        _ene = ene;
    }

    public IServicioEmpresaClient? Resolver(string nombre) =>
        NormalizarNombre(nombre) switch
        {
            "Universidad" => _uni,
            "Telefonia" => _tel,
            "Energia" => _ene,
            _ => null
        };

    public string? NormalizarNombre(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre)) return null;
        var n = nombre.Trim().ToLowerInvariant();
        return n switch
        {
            "universidad" or "uni" => "Universidad",
            "telefonia" or "telefonía" or "tel" => "Telefonia",
            "energia" or "energía" or "ee" or "energy" => "Energia",
            _ => null
        };
    }
}
