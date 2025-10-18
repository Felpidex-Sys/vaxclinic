using VixClinic.Core.Enums;

namespace VixClinic.Core.Entities;

public class Cliente
{
    public string Cpf { get; set; } = null!;
    public string NomeCompleto { get; set; } = null!;
    public DateTime? DataNasc { get; set; }
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public string? Alergias { get; set; }
    public string? Observacoes { get; set; }
    public ClienteStatus Status { get; set; } = ClienteStatus.ATIVO;
    
    // Navegação
    public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
    public ICollection<Aplicacao> Aplicacoes { get; set; } = new List<Aplicacao>();
}
