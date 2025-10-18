using FluentValidation;
using VixClinic.Application.DTOs;
using VixClinic.Application.Helpers;

namespace VixClinic.Application.Validators;

public class AplicacaoValidator : AbstractValidator<AplicacaoDto>
{
    public AplicacaoValidator()
    {
        RuleFor(a => a.DataAplicacao)
            .NotEmpty().WithMessage("Data é obrigatória")
            .LessThanOrEqualTo(DateTime.Today).WithMessage("Data não pode ser no futuro");

        When(a => a.Dose.HasValue, () =>
        {
            RuleFor(a => a.Dose)
                .GreaterThan(0).WithMessage("Dose deve ser maior que 0");
        });

        RuleFor(a => a.FuncionarioId)
            .GreaterThan(0).WithMessage("Funcionário é obrigatório");

        RuleFor(a => a.ClienteCpf)
            .NotEmpty().WithMessage("CPF do cliente é obrigatório")
            .Must(CpfFormatter.Validate).WithMessage("CPF inválido");

        When(a => a.AgendamentoId.HasValue, () =>
        {
            RuleFor(a => a.AgendamentoId)
                .GreaterThan(0).WithMessage("ID do agendamento inválido");
        });
    }
}
