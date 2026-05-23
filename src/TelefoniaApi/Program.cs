using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TelefoniaApi.Data;
using TelefoniaApi.Endpoints;
using TelefoniaApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("Db")
    ?? "Server=localhost;Port=3306;Database=tel_db;User=root;Password=root;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

var bancoUrl = builder.Configuration["Servicios:Banco"] ?? "http://localhost:5001";
builder.Services.AddHttpClient<BancoClient>(client =>
{
    client.BaseAddress = new Uri(bancoUrl);
    client.Timeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex,
            "No se pudo conectar/crear la base de datos al iniciar. " +
            "Verifique MySQL en la conexión configurada.");
    }
}

app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("TelefoniaApi - Ecosistema de Pagos");
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/info", () => Results.Ok(new
{
    servicio = "TelefoniaApi",
    empresa = app.Configuration["EmpresaNombre"] ?? "Telefonia",
    docs = "/scalar/v1",
    openapi = "/openapi/v1.json"
})).ExcludeFromDescription();

app.MapClientes();
app.MapPagos();
app.MapApiPublica();
app.MapTesoreria();
app.MapReportes();
app.MapSeed();

app.MapFallbackToFile("index.html");

app.Run();
