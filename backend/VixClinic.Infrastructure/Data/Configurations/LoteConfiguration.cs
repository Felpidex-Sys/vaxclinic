using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VixClinic.Core.Entities;

namespace VixClinic.Infrastructure.Data.Configurations;

public class LoteConfiguration : IEntityTypeConfiguration<Lote>
{
    public void Configure(EntityTypeBuilder<Lote> builder)
    {
        builder.ToTable("lote");

        // Primary Key
        builder.HasKey(l => l.NumLote);
        builder.Property(l => l.NumLote)
            .HasColumnName("numlote")
            .ValueGeneratedOnAdd();

        // Properties
        builder.Property(l => l.CodigoLote)
            .HasColumnName("codigolote")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(l => l.QuantidadeInicial)
            .HasColumnName("quantidadeinicial")
            .IsRequired();

        builder.Property(l => l.QuantidadeDisponivel)
            .HasColumnName("quantidadedisponivel")
            .IsRequired();

        builder.Property(l => l.DataValidade)
            .HasColumnName("datavalidade")
            .IsRequired();

        builder.Property(l => l.PrecoCompra)
            .HasColumnName("precocompra")
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(l => l.PrecoVenda)
            .HasColumnName("precovenda")
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(l => l.VacinaId)
            .HasColumnName("vacina_idvacina")
            .IsRequired();

        // Indexes
        builder.HasIndex(l => l.CodigoLote).IsUnique();

        // Navigation properties
        builder.HasOne(l => l.Vacina)
            .WithMany(v => v.Lotes)
            .HasForeignKey(l => l.VacinaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(l => l.Agendamentos)
            .WithOne(a => a.Lote)
            .HasForeignKey(a => a.LoteNumLote)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
