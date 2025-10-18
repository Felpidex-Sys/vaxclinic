using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VixClinic.Core.Entities;
using VixClinic.Core.Enums;

namespace VixClinic.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("cliente");

        // Primary Key
        builder.HasKey(c => c.Cpf);
        builder.Property(c => c.Cpf)
            .HasColumnName("cpf")
            .HasMaxLength(11)
            .IsRequired();

        // Properties
        builder.Property(c => c.NomeCompleto)
            .HasColumnName("nomecompleto")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(c => c.DataNasc)
            .HasColumnName("datanasc");

        builder.Property(c => c.Email)
            .HasColumnName("email")
            .HasMaxLength(255);

        builder.Property(c => c.Telefone)
            .HasColumnName("telefone")
            .HasMaxLength(11);

        builder.Property(c => c.Alergias)
            .HasColumnName("alergias")
            .HasColumnType("text");

        builder.Property(c => c.Status)
            .HasColumnName("status")
            .HasDefaultValue(ClienteStatus.ATIVO)
            .IsRequired();

        // Indexes
        builder.HasIndex(c => c.Email).IsUnique();

        // Navigation properties
        builder.HasMany(c => c.Agendamentos)
            .WithOne(a => a.Cliente)
            .HasForeignKey(a => a.ClienteCpf)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Aplicacoes)
            .WithOne(a => a.Cliente)
            .HasForeignKey(a => a.ClienteCpf)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
