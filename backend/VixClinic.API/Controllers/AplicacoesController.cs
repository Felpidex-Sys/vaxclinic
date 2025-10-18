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
public class AplicacoesController : ControllerBase
{
    private readonly VixClinicContext _context;
    private readonly IMapper _mapper;

    public AplicacoesController(VixClinicContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AplicacaoDto>>> GetAplicacoes()
    {
        var aplicacoes = await _context.Aplicacoes
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Agendamento)
            .ToListAsync();

        return Ok(_mapper.Map<List<AplicacaoDto>>(aplicacoes));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AplicacaoDto>> GetAplicacao(int id)
    {
        var aplicacao = await _context.Aplicacoes
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Agendamento)
            .FirstOrDefaultAsync(a => a.IdAplicacao == id);

        if (aplicacao == null)
        {
            return NotFound(new { message = "Aplicação não encontrada" });
        }

        return Ok(_mapper.Map<AplicacaoDto>(aplicacao));
    }

    [HttpPost]
    public async Task<ActionResult<AplicacaoDto>> CreateAplicacao([FromBody] AplicacaoDto aplicacaoDto)
    {
        var cpfFormatado = CpfFormatter.Format(aplicacaoDto.ClienteCpf!);

        if (!await _context.Clientes.AnyAsync(c => c.Cpf == cpfFormatado))
        {
            return NotFound(new { message = "Cliente não encontrado" });
        }

        if (!await _context.Funcionarios.AnyAsync(f => f.IdFuncionario == aplicacaoDto.FuncionarioId))
        {
            return NotFound(new { message = "Funcionário não encontrado" });
        }

        if (aplicacaoDto.AgendamentoId.HasValue)
        {
            var agendamento = await _context.Agendamentos.FindAsync(aplicacaoDto.AgendamentoId);
            if (agendamento == null)
            {
                return NotFound(new { message = "Agendamento não encontrado" });
            }

            // Marcar agendamento como REALIZADO (trigger do PostgreSQL fará isso, mas fazemos aqui também)
            agendamento.Status = Core.Enums.AgendamentoStatus.REALIZADO;
        }

        var aplicacao = _mapper.Map<Aplicacao>(aplicacaoDto);
        aplicacao.ClienteCpf = cpfFormatado;

        _context.Aplicacoes.Add(aplicacao);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAplicacao), new { id = aplicacao.IdAplicacao },
            _mapper.Map<AplicacaoDto>(aplicacao));
    }

    [HttpGet("cliente/{cpf}")]
    public async Task<ActionResult<IEnumerable<AplicacaoDto>>> GetAplicacoesByCliente(string cpf)
    {
        var cpfFormatado = CpfFormatter.Format(cpf);

        var aplicacoes = await _context.Aplicacoes
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Agendamento)
                .ThenInclude(ag => ag!.Lote)
                    .ThenInclude(l => l!.Vacina)
            .Where(a => a.ClienteCpf == cpfFormatado)
            .OrderByDescending(a => a.DataAplicacao)
            .ToListAsync();

        return Ok(_mapper.Map<List<AplicacaoDto>>(aplicacoes));
    }
}
