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
public class AgendamentosController : ControllerBase
{
    private readonly VixClinicContext _context;
    private readonly IMapper _mapper;

    public AgendamentosController(VixClinicContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AgendamentoDto>>> GetAgendamentos()
    {
        var agendamentos = await _context.Agendamentos
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Lote)
                .ThenInclude(l => l!.Vacina)
            .ToListAsync();

        return Ok(_mapper.Map<List<AgendamentoDto>>(agendamentos));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AgendamentoDto>> GetAgendamento(int id)
    {
        var agendamento = await _context.Agendamentos
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Lote)
                .ThenInclude(l => l!.Vacina)
            .FirstOrDefaultAsync(a => a.IdAgendamento == id);

        if (agendamento == null)
        {
            return NotFound(new { message = "Agendamento não encontrado" });
        }

        return Ok(_mapper.Map<AgendamentoDto>(agendamento));
    }

    [HttpPost]
    public async Task<ActionResult<AgendamentoDto>> CreateAgendamento([FromBody] AgendamentoDto agendamentoDto)
    {
        var cpfFormatado = CpfFormatter.Format(agendamentoDto.ClienteCpf!);

        if (!await _context.Clientes.AnyAsync(c => c.Cpf == cpfFormatado))
        {
            return NotFound(new { message = "Cliente não encontrado" });
        }

        if (agendamentoDto.FuncionarioId.HasValue &&
            !await _context.Funcionarios.AnyAsync(f => f.IdFuncionario == agendamentoDto.FuncionarioId))
        {
            return NotFound(new { message = "Funcionário não encontrado" });
        }

        var lote = await _context.Lotes.FindAsync(agendamentoDto.LoteNumLote);
        if (lote == null)
        {
            return NotFound(new { message = "Lote não encontrado" });
        }

        if (lote.QuantidadeDisponivel <= 0)
        {
            return BadRequest(new { message = "Lote sem estoque disponível" });
        }

        var agendamento = _mapper.Map<Agendamento>(agendamentoDto);
        agendamento.ClienteCpf = cpfFormatado;

        _context.Agendamentos.Add(agendamento);

        // Reservar estoque (trigger do PostgreSQL fará isso, mas fazemos aqui também)
        lote.QuantidadeDisponivel--;

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAgendamento), new { id = agendamento.IdAgendamento },
            _mapper.Map<AgendamentoDto>(agendamento));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AgendamentoDto>> UpdateAgendamento(int id, [FromBody] AgendamentoDto agendamentoDto)
    {
        var agendamento = await _context.Agendamentos.FindAsync(id);

        if (agendamento == null)
        {
            return NotFound(new { message = "Agendamento não encontrado" });
        }

        var cpfFormatado = CpfFormatter.Format(agendamentoDto.ClienteCpf!);

        if (!await _context.Clientes.AnyAsync(c => c.Cpf == cpfFormatado))
        {
            return NotFound(new { message = "Cliente não encontrado" });
        }

        if (agendamentoDto.FuncionarioId.HasValue &&
            !await _context.Funcionarios.AnyAsync(f => f.IdFuncionario == agendamentoDto.FuncionarioId))
        {
            return NotFound(new { message = "Funcionário não encontrado" });
        }

        // Se mudou o status para REALIZADO, não permitir voltar
        if (agendamento.Status == Core.Enums.AgendamentoStatus.REALIZADO &&
            agendamentoDto.Status != Core.Enums.AgendamentoStatus.REALIZADO)
        {
            return BadRequest(new { message = "Não é possível alterar agendamento já realizado" });
        }

        var loteAnterior = agendamento.LoteNumLote;
        
        _mapper.Map(agendamentoDto, agendamento);
        agendamento.ClienteCpf = cpfFormatado;

        // Se mudou o lote, devolver estoque do anterior e reservar do novo
        if (loteAnterior != agendamentoDto.LoteNumLote)
        {
            var loteAnt = await _context.Lotes.FindAsync(loteAnterior);
            if (loteAnt != null)
            {
                loteAnt.QuantidadeDisponivel++;
            }

            var loteNovo = await _context.Lotes.FindAsync(agendamentoDto.LoteNumLote);
            if (loteNovo != null)
            {
                if (loteNovo.QuantidadeDisponivel <= 0)
                {
                    return BadRequest(new { message = "Lote sem estoque disponível" });
                }
                loteNovo.QuantidadeDisponivel--;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<AgendamentoDto>(agendamento));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAgendamento(int id)
    {
        var agendamento = await _context.Agendamentos.FindAsync(id);

        if (agendamento == null)
        {
            return NotFound(new { message = "Agendamento não encontrado" });
        }

        if (agendamento.Status == Core.Enums.AgendamentoStatus.REALIZADO)
        {
            return BadRequest(new { message = "Não é possível excluir agendamento já realizado" });
        }

        // Devolver estoque
        var lote = await _context.Lotes.FindAsync(agendamento.LoteNumLote);
        if (lote != null)
        {
            lote.QuantidadeDisponivel++;
        }

        _context.Agendamentos.Remove(agendamento);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
