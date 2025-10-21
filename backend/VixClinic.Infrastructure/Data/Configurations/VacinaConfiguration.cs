using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VixClinic.Core.Entities;
using VixClinic.Core.Enums;

namespace VixClinic.Infrastructure.Data.Configurations;

public class VacinaConfiguration : IEntityTypeConfiguration<Vacina>
{
    public void Configure(EntityTypeBuilder<Vacina> builder)
    {
        builder.ToTable("vacina");

        // Primary Key
        builder.HasKey(v => v.IdVacina);
        builder.Property(v => v.IdVacina)
            .HasColumnName("idvacina")
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(v => v.Nome)
            .HasColumnName("nome")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(v => v.Fabricante)
            .HasColumnName("fabricante")
            .HasMaxLength(255);

        builder.Property(v => v.Categoria)
            .HasColumnName("categoria");

        builder.Property(v => v.QuantidadeDoses)
            .HasColumnName("quantidadedoses");

        builder.Property(v => v.IntervaloDoses)
            .HasColumnName("intervalodoses");

        builder.Property(v => v.Status)
            .HasColumnName("status")
            .HasDefaultValue(VacinaStatus.ATIVA)
            .IsRequired();

        // Navigation properties
        builder.HasMany(v => v.Lotes)
            .WithOne(l => l.Vacina)
            .HasForeignKey(l => l.VacinaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
