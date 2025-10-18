namespace VixClinic.Application.DTOs;

public class AplicacaoDto
{
    public int? IdAplicacao { get; set; }
    public DateTime DataAplicacao { get; set; }
    public int? Dose { get; set; }
    public string? ReacoesAdversas { get; set; }
    public string? Observacoes { get; set; }
    public int FuncionarioId { get; set; }
    public string ClienteCpf { get; set; } = null!;
    public int? AgendamentoId { get; set; }
}
