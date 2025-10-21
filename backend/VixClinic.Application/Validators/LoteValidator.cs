using FluentValidation;
using VixClinic.Application.DTOs;

namespace VixClinic.Application.Validators;

public class LoteValidator : AbstractValidator<LoteDto>
{
    public LoteValidator(bool isUpdate = false)
    {
        RuleFor(l => l.CodigoLote)
            .NotEmpty().WithMessage("Código do lote é obrigatório")
            .MaximumLength(100).WithMessage("Código deve ter no máximo 100 caracteres");

        RuleFor(l => l.QuantidadeInicial)
            .GreaterThan(0).WithMessage("Quantidade inicial deve ser maior que 0");

        RuleFor(l => l.QuantidadeDisponivel)
            .GreaterThanOrEqualTo(0).WithMessage("Quantidade disponível não pode ser negativa");

        RuleFor(l => l.DataValidade)
            .NotEmpty().WithMessage("Data de validade é obrigatória")
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Data de validade não pode estar vencida");

        RuleFor(l => l.VacinaId)
            .GreaterThan(0).WithMessage("Vacina é obrigatória");

        // Preço de compra é imutável, validar apenas no CREATE
        if (!isUpdate)
        {
            RuleFor(l => l.PrecoCompra)
                .GreaterThanOrEqualTo(0).WithMessage("Preço de compra não pode ser negativo");
        }

        RuleFor(l => l.PrecoVenda)
            .GreaterThanOrEqualTo(0).WithMessage("Preço de venda não pode ser negativo");
    }
}
