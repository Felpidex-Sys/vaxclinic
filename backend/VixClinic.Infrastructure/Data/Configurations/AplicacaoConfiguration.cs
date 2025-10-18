using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VixClinic.Core.Entities;

namespace VixClinic.Infrastructure.Data.Configurations;

public class AplicacaoConfiguration : IEntityTypeConfiguration<Aplicacao>
{
    public void Configure(EntityTypeBuilder<Aplicacao> builder)
    {
        builder.ToTable("aplicacao");

        // Primary Key
        builder.HasKey(a => a.IdAplicacao);
        builder.Property(a => a.IdAplicacao)
            .HasColumnName("idaplicacao")
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(a => a.DataAplicacao)
            .HasColumnName("dataaplicacao")
            .IsRequired();

        builder.Property(a => a.Dose)
            .HasColumnName("dose");

        builder.Property(a => a.ReacoesAdversas)
            .HasColumnName("reacoes")
            .HasColumnType("text");

        builder.Property(a => a.Observacoes)
            .HasColumnName("observacoes")
            .HasColumnType("text");

        builder.Property(a => a.FuncionarioId)
            .HasColumnName("funcionario_idfuncionario")
            .IsRequired();

        builder.Property(a => a.ClienteCpf)
            .HasColumnName("cliente_cpf")
            .HasMaxLength(11)
            .IsRequired();

        builder.Property(a => a.AgendamentoId)
            .HasColumnName("agendamento_idagendamento");

        // Navigation properties
        builder.HasOne(a => a.Funcionario)
            .WithMany(f => f.Aplicacoes)
            .HasForeignKey(a => a.FuncionarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Cliente)
            .WithMany(c => c.Aplicacoes)
            .HasForeignKey(a => a.ClienteCpf)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Agendamento)
            .WithMany(ag => ag.Aplicacoes)
            .HasForeignKey(a => a.AgendamentoId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
