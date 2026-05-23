using Microsoft.EntityFrameworkCore;
using UniversidadApi.Models;

namespace UniversidadApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<ClienteServicio> Clientes => Set<ClienteServicio>();
    public DbSet<Cuota> Cuotas => Set<Cuota>();
    public DbSet<MovimientoEmpresa> Movimientos => Set<MovimientoEmpresa>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<ClienteServicio>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(50);
        });

        b.Entity<Cuota>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Monto).HasPrecision(18, 2);
            e.HasOne(x => x.Cliente)
                .WithMany(c => c.Cuotas)
                .HasForeignKey(x => x.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.ClienteId, x.Periodo });
        });

        b.Entity<MovimientoEmpresa>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Monto).HasPrecision(18, 2);
            e.HasIndex(x => x.ClienteId);
            e.HasIndex(x => x.Referencia);
        });
    }
}
