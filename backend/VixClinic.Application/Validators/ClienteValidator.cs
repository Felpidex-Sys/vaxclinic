using FluentValidation;
using VixClinic.Application.DTOs;
using VixClinic.Application.Helpers;

namespace VixClinic.Application.Validators;

public class ClienteValidator : AbstractValidator<ClienteDto>
{
    public ClienteValidator()
    {
        RuleFor(c => c.Cpf)
            .NotEmpty().WithMessage("CPF é obrigatório")
            .Must(CpfFormatter.Validate).WithMessage("CPF inválido");

        RuleFor(c => c.NomeCompleto)
            .NotEmpty().WithMessage("Nome completo é obrigatório")
            .MinimumLength(3).WithMessage("Nome deve ter no mínimo 3 caracteres")
            .MaximumLength(255).WithMessage("Nome deve ter no máximo 255 caracteres");

        When(c => c.DataNasc.HasValue, () =>
        {
            RuleFor(c => c.DataNasc)
                .LessThanOrEqualTo(DateTime.Today).WithMessage("Data de nascimento não pode ser no futuro");
        });

        When(c => !string.IsNullOrWhiteSpace(c.Email), () =>
        {
            RuleFor(c => c.Email)
                .EmailAddress().WithMessage("Email inválido");
        });

        When(c => !string.IsNullOrWhiteSpace(c.Telefone), () =>
        {
            RuleFor(c => c.Telefone)
                .Must(TelefoneFormatter.Validate!).WithMessage("Telefone inválido");
        });

        RuleFor(c => c.Status)
            .IsInEnum().WithMessage("Status inválido");
    }
}
