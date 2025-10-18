using FluentValidation;
using VixClinic.Application.DTOs;
using VixClinic.Application.Helpers;

namespace VixClinic.Application.Validators;

public class FuncionarioValidator : AbstractValidator<FuncionarioDto>
{
    public FuncionarioValidator(bool isUpdate = false)
    {
        RuleFor(f => f.NomeCompleto)
            .NotEmpty().WithMessage("Nome completo é obrigatório")
            .MinimumLength(3).WithMessage("Nome deve ter no mínimo 3 caracteres")
            .MaximumLength(255).WithMessage("Nome deve ter no máximo 255 caracteres");

        RuleFor(f => f.Cpf)
            .NotEmpty().WithMessage("CPF é obrigatório")
            .Must(CpfFormatter.Validate).WithMessage("CPF inválido");

        RuleFor(f => f.Email)
            .NotEmpty().WithMessage("Email é obrigatório")
            .EmailAddress().WithMessage("Email inválido");

        When(f => !string.IsNullOrWhiteSpace(f.Telefone), () =>
        {
            RuleFor(f => f.Telefone)
                .Must(TelefoneFormatter.Validate!).WithMessage("Telefone inválido");
        });

        // Senha é obrigatória apenas no CREATE
        if (!isUpdate)
        {
            RuleFor(f => f.Senha)
                .NotEmpty().WithMessage("Senha é obrigatória")
                .MinimumLength(8).WithMessage("Senha deve ter no mínimo 8 caracteres");
        }
        else
        {
            When(f => !string.IsNullOrWhiteSpace(f.Senha), () =>
            {
                RuleFor(f => f.Senha)
                    .MinimumLength(8).WithMessage("Senha deve ter no mínimo 8 caracteres");
            });
        }

        RuleFor(f => f.Status)
            .IsInEnum().WithMessage("Status inválido");

        When(f => f.DataAdmissao.HasValue, () =>
        {
            RuleFor(f => f.DataAdmissao)
                .LessThanOrEqualTo(DateTime.Today).WithMessage("Data de admissão não pode ser no futuro");
        });
    }
}
