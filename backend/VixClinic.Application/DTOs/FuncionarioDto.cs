using VixClinic.Core.Enums;

namespace VixClinic.Application.DTOs;

public class FuncionarioDto
{
    public int? IdFuncionario { get; set; }
    public string NomeCompleto { get; set; } = null!;
    public string Cpf { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Telefone { get; set; }
    public string? Cargo { get; set; }
    public string? Senha { get; set; } // Opcional em UPDATE
    public FuncionarioStatus Status { get; set; } = FuncionarioStatus.ATIVO;
    public DateTime? DataAdmissao { get; set; }
}
