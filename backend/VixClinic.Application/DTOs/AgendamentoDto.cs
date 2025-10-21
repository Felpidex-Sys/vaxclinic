using VixClinic.Core.Enums;

namespace VixClinic.Application.DTOs;

public class AgendamentoDto
{
    public int? IdAgendamento { get; set; }
    public DateTime DataAgendada { get; set; }
    public AgendamentoStatus Status { get; set; } = AgendamentoStatus.AGENDADO;
    public string? Observacoes { get; set; }
    public string ClienteCpf { get; set; } = null!;
    public int? FuncionarioId { get; set; } // Opcional
    public int LoteNumLote { get; set; }
}
