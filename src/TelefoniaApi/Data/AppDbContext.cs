using Microsoft.EntityFrameworkCore;
using TelefoniaApi.Models;

namespace TelefoniaApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<ClienteServicio> Clientes => Set<ClienteServicio>();
    public DbSet<Cuota> Cuotas => Set<Cuota>();
    public DbSet<MovimientoEmpresa> Movimientos => Set<MovimientoEmpresa>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ClienteServicio>(e =>
        {
            e.ToTable("clientes");
            e.Property(c => c.Id).HasMaxLength(32);
        });

        modelBuilder.Entity<Cuota>(e =>
        {
            e.ToTable("cuotas");
            e.Property(c => c.Monto).HasPrecision(18, 2);
            e.HasIndex(c => new { c.ClienteId, c.Periodo });
            e.HasOne(c => c.Cliente)
                .WithMany(cl => cl.Cuotas)
                .HasForeignKey(c => c.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MovimientoEmpresa>(e =>
        {
            e.ToTable("movimientos");
            e.Property(m => m.Monto).HasPrecision(18, 2);
            e.HasIndex(m => m.Referencia);
        });

        base.OnModelCreating(modelBuilder);
    }
}
