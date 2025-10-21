using VixClinic.Core.Enums;

namespace VixClinic.Core.Entities;

public class Vacina
{
    public int IdVacina { get; set; }
    public string Nome { get; set; } = null!;
    public string? Fabricante { get; set; }
    public VacinaCategoria? Categoria { get; set; }
    public int? QuantidadeDoses { get; set; }
    public int? IntervaloDoses { get; set; }
    public string? Descricao { get; set; }
    public VacinaStatus Status { get; set; } = VacinaStatus.ATIVA;
    
    // Navegação
    public ICollection<Lote> Lotes { get; set; } = new List<Lote>();
}
