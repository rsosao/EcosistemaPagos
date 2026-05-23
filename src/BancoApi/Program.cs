using BancoApi.Data;
using BancoApi.Endpoints;
using BancoApi.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("Db")
    ?? "Server=localhost;Port=3306;Database=banco_db;User=root;Password=root;";

builder.Services.AddDbContext<BancoDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddScoped<IPagosService, PagosService>();
builder.Services.AddScoped<ISeedService, SeedService>();
builder.Services.AddScoped<IServiciosEmpresaResolver, ServiciosEmpresaResolver>();

var urlUniversidad = builder.Configuration["Servicios:Universidad"] ?? "http://localhost:5002";
var urlTelefonia = builder.Configuration["Servicios:Telefonia"] ?? "http://localhost:5003";
var urlEnergia = builder.Configuration["Servicios:Energia"] ?? "http://localhost:5004";

builder.Services.AddHttpClient<UniversidadClient>(client =>
{
    client.BaseAddress = new Uri(urlUniversidad);
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<TelefoniaClient>(client =>
{
    client.BaseAddress = new Uri(urlTelefonia);
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<EnergiaClient>(client =>
{
    client.BaseAddress = new Uri(urlEnergia);
    client.Timeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BancoDbContext>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex,
            "No se pudo conectar/crear la base de datos al iniciar. " +
            "Verifique MySQL local en la conexión configurada.");
    }
}

app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("BancoApi - Ecosistema de Pagos");
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapClientesEndpoints();
app.MapCuentasEndpoints();
app.MapTarjetasEndpoints();
app.MapPagosServicioEndpoints();
app.MapApiPublicaEndpoints();
app.MapReportesEndpoints();
app.MapSeedEndpoints();

app.MapFallbackToFile("index.html");

app.Run();
