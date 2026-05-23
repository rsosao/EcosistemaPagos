using EnergiaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Data;

public class EnergiaDbContext : DbContext
{
    public EnergiaDbContext(DbContextOptions<EnergiaDbContext> options) : base(options) { }

    public DbSet<ClienteServicio> Clientes => Set<ClienteServicio>();
    public DbSet<Cuota> Cuotas => Set<Cuota>();
    public DbSet<MovimientoEmpresa> Movimientos => Set<MovimientoEmpresa>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ClienteServicio>(e =>
        {
            e.ToTable("clientes");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).HasMaxLength(50);
            e.Property(c => c.Nombre).HasMaxLength(150).IsRequired();
        });

        modelBuilder.Entity<Cuota>(e =>
        {
            e.ToTable("cuotas");
            e.HasKey(c => c.Id);
            e.Property(c => c.ClienteId).HasMaxLength(50).IsRequired();
            e.Property(c => c.Periodo).HasMaxLength(10).IsRequired();
            e.Property(c => c.Monto).HasColumnType("decimal(18,2)");
            e.Property(c => c.Referencia).HasMaxLength(100);
            e.HasOne(c => c.Cliente)
                .WithMany(cl => cl.Cuotas)
                .HasForeignKey(c => c.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(c => new { c.ClienteId, c.Periodo });
        });

        modelBuilder.Entity<MovimientoEmpresa>(e =>
        {
            e.ToTable("movimientos");
            e.HasKey(m => m.Id);
            e.Property(m => m.Monto).HasColumnType("decimal(18,2)");
            e.Property(m => m.ClienteId).HasMaxLength(50);
            e.Property(m => m.Referencia).HasMaxLength(100);
            e.HasIndex(m => m.Referencia);
        });
    }
}
