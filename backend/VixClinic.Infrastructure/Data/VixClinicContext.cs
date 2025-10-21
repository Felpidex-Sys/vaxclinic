using Microsoft.EntityFrameworkCore;
using VixClinic.Core.Entities;
using VixClinic.Infrastructure.Data.Configurations;

namespace VixClinic.Infrastructure.Data;

public class VixClinicContext : DbContext
{
    public VixClinicContext(DbContextOptions<VixClinicContext> options) : base(options)
    {
    }

    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Funcionario> Funcionarios { get; set; }
    public DbSet<Vacina> Vacinas { get; set; }
    public DbSet<Lote> Lotes { get; set; }
    public DbSet<Agendamento> Agendamentos { get; set; }
    public DbSet<Aplicacao> Aplicacoes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations
        modelBuilder.ApplyConfiguration(new ClienteConfiguration());
        modelBuilder.ApplyConfiguration(new FuncionarioConfiguration());
        modelBuilder.ApplyConfiguration(new VacinaConfiguration());
        modelBuilder.ApplyConfiguration(new LoteConfiguration());
        modelBuilder.ApplyConfiguration(new AgendamentoConfiguration());
        modelBuilder.ApplyConfiguration(new AplicacaoConfiguration());

        // Create PostgreSQL enums (if needed)
        modelBuilder.HasPostgresEnum<Core.Enums.ClienteStatus>("cliente_status");
        modelBuilder.HasPostgresEnum<Core.Enums.FuncionarioStatus>("funcionario_status");
        modelBuilder.HasPostgresEnum<Core.Enums.VacinaStatus>("vacina_status");
        modelBuilder.HasPostgresEnum<Core.Enums.VacinaCategoria>("vacina_categoria");
        modelBuilder.HasPostgresEnum<Core.Enums.AgendamentoStatus>("agendamento_status");
    }
}
