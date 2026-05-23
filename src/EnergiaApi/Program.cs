using EnergiaApi.Data;
using EnergiaApi.Endpoints;
using EnergiaApi.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("Db")
    ?? "Server=localhost;Port=3306;Database=ee_db;User=root;Password=root;";

builder.Services.AddDbContext<EnergiaDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddScoped<PagosService>();

var bancoUrl = builder.Configuration["Servicios:Banco"] ?? "http://localhost:5001";
builder.Services.AddHttpClient<BancoClient>(client =>
{
    client.BaseAddress = new Uri(bancoUrl);
    client.Timeout = TimeSpan.FromSeconds(15);
});

builder.Services.ConfigureHttpJsonOptions(opts =>
{
    opts.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EnergiaDbContext>();
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
    options.WithTitle("EnergiaApi - Ecosistema de Pagos");
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapClientesEndpoints();
app.MapCuotasEndpoints();
app.MapPagosEndpoints();
app.MapApiPublicaEndpoints();
app.MapTesoreriaEndpoints();
app.MapReportesEndpoints();
app.MapSeedEndpoints();

app.MapFallbackToFile("index.html");

app.Run();
