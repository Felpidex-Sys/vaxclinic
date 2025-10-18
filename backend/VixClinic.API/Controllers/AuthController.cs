using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VixClinic.Application.DTOs;
using VixClinic.Application.Helpers;
using VixClinic.Infrastructure.Data;

namespace VixClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly VixClinicContext _context;
    private readonly JwtService _jwtService;
    private readonly PasswordHasher _passwordHasher;

    public AuthController(VixClinicContext context, JwtService jwtService, PasswordHasher passwordHasher)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var funcionario = await _context.Funcionarios
            .FirstOrDefaultAsync(f => f.Email == loginDto.Email);

        if (funcionario == null)
        {
            return Unauthorized(new { message = "Email ou senha inválidos" });
        }

        if (!_passwordHasher.VerifyPassword(loginDto.Password, funcionario.Senha))
        {
            return Unauthorized(new { message = "Email ou senha inválidos" });
        }

        if (funcionario.Status == Core.Enums.FuncionarioStatus.INATIVO)
        {
            return Unauthorized(new { message = "Usuário inativo" });
        }

        var token = _jwtService.GenerateToken(funcionario);

        var response = new LoginResponseDto
        {
            Token = token,
            User = new UserInfoDto
            {
                Id = funcionario.IdFuncionario,
                Nome = funcionario.NomeCompleto,
                Email = funcionario.Email,
                Cargo = funcionario.Cargo
            }
        };

        return Ok(response);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Com JWT, o logout é tratado no frontend removendo o token
        return Ok(new { message = "Logout realizado com sucesso" });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponseDto>> Refresh()
    {
        // Implementação simplificada - poderia validar refresh token
        return Ok(new { message = "Token refresh não implementado ainda" });
    }
}
