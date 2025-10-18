using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VixClinic.Core.Entities;
using VixClinic.Core.Enums;

namespace VixClinic.Infrastructure.Data.Configurations;

public class FuncionarioConfiguration : IEntityTypeConfiguration<Funcionario>
{
    public void Configure(EntityTypeBuilder<Funcionario> builder)
    {
        builder.ToTable("funcionario");

        // Primary Key
        builder.HasKey(f => f.IdFuncionario);
        builder.Property(f => f.IdFuncionario)
            .HasColumnName("idfuncionario")
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(f => f.NomeCompleto)
            .HasColumnName("nomecompleto")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(f => f.Cpf)
            .HasColumnName("cpf")
            .HasMaxLength(11)
            .IsRequired();

        builder.Property(f => f.Email)
            .HasColumnName("email")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(f => f.Senha)
            .HasColumnName("senha")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(f => f.Telefone)
            .HasColumnName("telefone")
            .HasMaxLength(11);

        builder.Property(f => f.Cargo)
            .HasColumnName("cargo")
            .HasMaxLength(100);

        builder.Property(f => f.DataAdmissao)
            .HasColumnName("dataadmissao");

        builder.Property(f => f.Status)
            .HasColumnName("status")
            .HasDefaultValue(FuncionarioStatus.ATIVO)
            .IsRequired();

        // Indexes
        builder.HasIndex(f => f.Cpf).IsUnique();
        builder.HasIndex(f => f.Email).IsUnique();

        // Navigation properties
        builder.HasMany(f => f.Agendamentos)
            .WithOne(a => a.Funcionario)
            .HasForeignKey(a => a.FuncionarioId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(f => f.Aplicacoes)
            .WithOne(a => a.Funcionario)
            .HasForeignKey(a => a.FuncionarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
