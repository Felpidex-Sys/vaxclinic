namespace VixClinic.Application.DTOs;

public class LoteDto
{
    public int? NumLote { get; set; }
    public string CodigoLote { get; set; } = null!;
    public int QuantidadeInicial { get; set; }
    public int QuantidadeDisponivel { get; set; }
    public DateTime DataValidade { get; set; }
    public decimal PrecoCompra { get; set; }
    public decimal PrecoVenda { get; set; }
    public int VacinaId { get; set; }
}
