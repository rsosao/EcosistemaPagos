using BancoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BancoApi.Data;

public class BancoDbContext : DbContext
{
    public BancoDbContext(DbContextOptions<BancoDbContext> options) : base(options) { }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Cuenta> Cuentas => Set<Cuenta>();
    public DbSet<Tarjeta> Tarjetas => Set<Tarjeta>();
    public DbSet<Movimiento> Movimientos => Set<Movimiento>();
    public DbSet<CuentaEmpresa> CuentasEmpresa => Set<CuentaEmpresa>();
    public DbSet<CuentaComisiones> CuentaComisiones => Set<CuentaComisiones>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Nombre).HasMaxLength(150).IsRequired();
            e.Property(c => c.Dpi).HasMaxLength(20).IsRequired();
            e.HasIndex(c => c.Dpi).IsUnique();
        });

        modelBuilder.Entity<Cuenta>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.NumeroCuenta).HasMaxLength(30).IsRequired();
            e.HasIndex(c => c.NumeroCuenta).IsUnique();
            e.Property(c => c.Saldo).HasColumnType("decimal(18,2)");
            e.Property(c => c.Tipo).HasConversion<int>();
            e.HasOne(c => c.Cliente)
             .WithMany(cl => cl.Cuentas)
             .HasForeignKey(c => c.ClienteId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Tarjeta>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Numero).HasMaxLength(20).IsRequired();
            e.HasIndex(t => t.Numero).IsUnique();
            e.Property(t => t.Cvv).HasMaxLength(4).IsRequired();
            e.Property(t => t.Tipo).HasConversion<int>();
            e.HasOne(t => t.Cuenta)
             .WithMany(c => c.Tarjetas)
             .HasForeignKey(t => t.CuentaId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Movimiento>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Tipo).HasConversion<int>();
            e.Property(m => m.Monto).HasColumnType("decimal(18,2)");
            e.Property(m => m.Referencia).HasMaxLength(50).IsRequired();
            e.Property(m => m.Descripcion).HasMaxLength(255);
            e.HasIndex(m => m.Referencia);
            e.HasOne(m => m.Cuenta)
             .WithMany(c => c.Movimientos)
             .HasForeignKey(m => m.CuentaId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CuentaEmpresa>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Nombre).HasMaxLength(50).IsRequired();
            e.HasIndex(c => c.Nombre).IsUnique();
            e.HasOne(c => c.Cuenta)
             .WithMany()
             .HasForeignKey(c => c.CuentaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CuentaComisiones>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasOne(c => c.Cuenta)
             .WithMany()
             .HasForeignKey(c => c.CuentaId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
