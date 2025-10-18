using FluentValidation;
using VixClinic.Application.DTOs;

namespace VixClinic.Application.Validators;

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(l => l.Email)
            .NotEmpty().WithMessage("Email é obrigatório")
            .EmailAddress().WithMessage("Email inválido");

        RuleFor(l => l.Password)
            .NotEmpty().WithMessage("Senha é obrigatória");
    }
}
