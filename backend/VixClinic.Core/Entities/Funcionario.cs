using VixClinic.Core.Enums;

namespace VixClinic.Core.Entities;

public class Funcionario
{
    public int IdFuncionario { get; set; }
    public string NomeCompleto { get; set; } = null!;
    public string Cpf { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Telefone { get; set; }
    public string? Cargo { get; set; }
    public string Senha { get; set; } = null!;
    public FuncionarioStatus Status { get; set; } = FuncionarioStatus.ATIVO;
    public DateTime? DataAdmissao { get; set; }
    
    // Navegação
    public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
    public ICollection<Aplicacao> Aplicacoes { get; set; } = new List<Aplicacao>();
}
