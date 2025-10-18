using FluentValidation;
using VixClinic.Application.DTOs;
using VixClinic.Application.Helpers;

namespace VixClinic.Application.Validators;

public class AgendamentoValidator : AbstractValidator<AgendamentoDto>
{
    public AgendamentoValidator()
    {
        RuleFor(a => a.DataAgendada)
            .NotEmpty().WithMessage("Data é obrigatória")
            .GreaterThan(DateTime.Now).WithMessage("Data deve ser no futuro");

        RuleFor(a => a.ClienteCpf)
            .NotEmpty().WithMessage("CPF do cliente é obrigatório")
            .Must(CpfFormatter.Validate).WithMessage("CPF inválido");

        When(a => a.FuncionarioId.HasValue, () =>
        {
            RuleFor(a => a.FuncionarioId)
                .GreaterThan(0).WithMessage("ID do funcionário inválido");
        });

        RuleFor(a => a.LoteNumLote)
            .GreaterThan(0).WithMessage("Lote é obrigatório");

        RuleFor(a => a.Status)
            .IsInEnum().WithMessage("Status inválido");
    }
}
