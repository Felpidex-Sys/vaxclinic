using VixClinic.Core.Enums;

namespace VixClinic.Core.Entities;

public class Agendamento
{
    public int IdAgendamento { get; set; }
    public DateTime DataAgendada { get; set; }
    public AgendamentoStatus Status { get; set; } = AgendamentoStatus.AGENDADO;
    public string? Observacoes { get; set; }
    public string ClienteCpf { get; set; } = null!;
    public int? FuncionarioId { get; set; }
    public int LoteNumLote { get; set; }
    
    // Navegação
    public Cliente Cliente { get; set; } = null!;
    public Funcionario? Funcionario { get; set; }
    public Lote Lote { get; set; } = null!;
    public ICollection<Aplicacao> Aplicacoes { get; set; } = new List<Aplicacao>();
}
