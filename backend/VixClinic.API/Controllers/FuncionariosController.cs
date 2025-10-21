using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VixClinic.Application.DTOs;
using VixClinic.Application.Helpers;
using VixClinic.Core.Entities;
using VixClinic.Infrastructure.Data;

namespace VixClinic.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FuncionariosController : ControllerBase
{
    private readonly VixClinicContext _context;
    private readonly IMapper _mapper;
    private readonly PasswordHasher _passwordHasher;

    public FuncionariosController(VixClinicContext context, IMapper mapper, PasswordHasher passwordHasher)
    {
        _context = context;
        _mapper = mapper;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FuncionarioDto>>> GetFuncionarios()
    {
        var funcionarios = await _context.Funcionarios.ToListAsync();
        return Ok(_mapper.Map<List<FuncionarioDto>>(funcionarios));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FuncionarioDto>> GetFuncionario(int id)
    {
        var funcionario = await _context.Funcionarios.FindAsync(id);

        if (funcionario == null)
        {
            return NotFound(new { message = "Funcionário não encontrado" });
        }

        return Ok(_mapper.Map<FuncionarioDto>(funcionario));
    }

    [HttpPost]
    public async Task<ActionResult<FuncionarioDto>> CreateFuncionario([FromBody] FuncionarioDto funcionarioDto)
    {
        var cpfFormatado = CpfFormatter.Format(funcionarioDto.Cpf!);

        if (await _context.Funcionarios.AnyAsync(f => f.Cpf == cpfFormatado))
        {
            return Conflict(new { message = "Funcionário com este CPF já existe" });
        }

        if (await _context.Funcionarios.AnyAsync(f => f.Email == funcionarioDto.Email))
        {
            return Conflict(new { message = "Email já cadastrado" });
        }

        var funcionario = _mapper.Map<Funcionario>(funcionarioDto);
        
        // Hash da senha
        if (!string.IsNullOrWhiteSpace(funcionarioDto.Senha))
        {
            funcionario.Senha = _passwordHasher.HashPassword(funcionarioDto.Senha);
        }

        _context.Funcionarios.Add(funcionario);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFuncionario), new { id = funcionario.IdFuncionario }, 
            _mapper.Map<FuncionarioDto>(funcionario));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FuncionarioDto>> UpdateFuncionario(int id, [FromBody] FuncionarioDto funcionarioDto)
    {
        var funcionario = await _context.Funcionarios.FindAsync(id);

        if (funcionario == null)
        {
            return NotFound(new { message = "Funcionário não encontrado" });
        }

        var cpfFormatado = CpfFormatter.Format(funcionarioDto.Cpf!);

        if (await _context.Funcionarios.AnyAsync(f => f.Cpf == cpfFormatado && f.IdFuncionario != id))
        {
            return Conflict(new { message = "CPF já cadastrado para outro funcionário" });
        }

        if (await _context.Funcionarios.AnyAsync(f => f.Email == funcionarioDto.Email && f.IdFuncionario != id))
        {
            return Conflict(new { message = "Email já cadastrado para outro funcionário" });
        }

        var senhaAtual = funcionario.Senha;

        _mapper.Map(funcionarioDto, funcionario);

        // Atualizar senha apenas se fornecida
        if (!string.IsNullOrWhiteSpace(funcionarioDto.Senha))
        {
            funcionario.Senha = _passwordHasher.HashPassword(funcionarioDto.Senha);
        }
        else
        {
            funcionario.Senha = senhaAtual;
        }

        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<FuncionarioDto>(funcionario));
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var totalFuncionarios = await _context.Funcionarios.CountAsync();
        var funcionariosAtivos = await _context.Funcionarios
            .CountAsync(f => f.Status == Core.Enums.FuncionarioStatus.ATIVO);
        var funcionariosInativos = await _context.Funcionarios
            .CountAsync(f => f.Status == Core.Enums.FuncionarioStatus.INATIVO);

        return Ok(new
        {
            total = totalFuncionarios,
            ativos = funcionariosAtivos,
            inativos = funcionariosInativos
        });
    }
}
