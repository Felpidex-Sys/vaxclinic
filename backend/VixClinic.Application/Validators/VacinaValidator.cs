using FluentValidation;
using VixClinic.Application.DTOs;

namespace VixClinic.Application.Validators;

public class VacinaValidator : AbstractValidator<VacinaDto>
{
    public VacinaValidator()
    {
        RuleFor(v => v.Nome)
            .NotEmpty().WithMessage("Nome é obrigatório")
            .MinimumLength(2).WithMessage("Nome deve ter no mínimo 2 caracteres")
            .MaximumLength(255).WithMessage("Nome deve ter no máximo 255 caracteres");

        When(v => v.QuantidadeDoses.HasValue, () =>
        {
            RuleFor(v => v.QuantidadeDoses)
                .GreaterThan(0).WithMessage("Quantidade de doses deve ser maior que 0");
        });

        When(v => v.IntervaloDoses.HasValue, () =>
        {
            RuleFor(v => v.IntervaloDoses)
                .GreaterThanOrEqualTo(0).WithMessage("Intervalo entre doses não pode ser negativo");
        });

        RuleFor(v => v.Status)
            .IsInEnum().WithMessage("Status inválido");

        When(v => v.Categoria.HasValue, () =>
        {
            RuleFor(v => v.Categoria)
                .IsInEnum().WithMessage("Categoria inválida");
        });
    }
}
