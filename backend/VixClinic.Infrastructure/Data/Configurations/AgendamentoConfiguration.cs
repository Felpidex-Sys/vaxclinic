using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VixClinic.Core.Entities;
using VixClinic.Core.Enums;

namespace VixClinic.Infrastructure.Data.Configurations;

public class AgendamentoConfiguration : IEntityTypeConfiguration<Agendamento>
{
    public void Configure(EntityTypeBuilder<Agendamento> builder)
    {
        builder.ToTable("agendamento");

        // Primary Key
        builder.HasKey(a => a.IdAgendamento);
        builder.Property(a => a.IdAgendamento)
            .HasColumnName("idagendamento")
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(a => a.DataAgendada)
            .HasColumnName("dataagendada")
            .IsRequired();

        builder.Property(a => a.Status)
            .HasColumnName("status")
            .HasDefaultValue(AgendamentoStatus.AGENDADO)
            .IsRequired();

        builder.Property(a => a.ClienteCpf)
            .HasColumnName("cliente_cpf")
            .HasMaxLength(11)
            .IsRequired();

        builder.Property(a => a.FuncionarioId)
            .HasColumnName("funcionario_idfuncionario");

        builder.Property(a => a.LoteNumLote)
            .HasColumnName("lote_numlote")
            .IsRequired();

        // Navigation properties
        builder.HasOne(a => a.Cliente)
            .WithMany(c => c.Agendamentos)
            .HasForeignKey(a => a.ClienteCpf)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Funcionario)
            .WithMany(f => f.Agendamentos)
            .HasForeignKey(a => a.FuncionarioId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Lote)
            .WithMany(l => l.Agendamentos)
            .HasForeignKey(a => a.LoteNumLote)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.Aplicacoes)
            .WithOne(ap => ap.Agendamento)
            .HasForeignKey(ap => ap.AgendamentoId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
