using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VixClinic.Application.DTOs;
using VixClinic.Core.Entities;
using VixClinic.Infrastructure.Data;

namespace VixClinic.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LotesController : ControllerBase
{
    private readonly VixClinicContext _context;
    private readonly IMapper _mapper;

    public LotesController(VixClinicContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LoteDto>>> GetLotes()
    {
        var lotes = await _context.Lotes
            .Include(l => l.Vacina)
            .ToListAsync();
        return Ok(_mapper.Map<List<LoteDto>>(lotes));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LoteDto>> GetLote(int id)
    {
        var lote = await _context.Lotes
            .Include(l => l.Vacina)
            .FirstOrDefaultAsync(l => l.NumLote == id);

        if (lote == null)
        {
            return NotFound(new { message = "Lote não encontrado" });
        }

        return Ok(_mapper.Map<LoteDto>(lote));
    }

    [HttpPost]
    public async Task<ActionResult<LoteDto>> CreateLote([FromBody] LoteDto loteDto)
    {
        if (await _context.Lotes.AnyAsync(l => l.CodigoLote == loteDto.CodigoLote))
        {
            return Conflict(new { message = "Lote com este código já existe" });
        }

        if (!await _context.Vacinas.AnyAsync(v => v.IdVacina == loteDto.VacinaId))
        {
            return NotFound(new { message = "Vacina não encontrada" });
        }

        var lote = _mapper.Map<Lote>(loteDto);
        _context.Lotes.Add(lote);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLote), new { id = lote.NumLote }, 
            _mapper.Map<LoteDto>(lote));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<LoteDto>> UpdateLote(int id, [FromBody] LoteDto loteDto)
    {
        var lote = await _context.Lotes.FindAsync(id);

        if (lote == null)
        {
            return NotFound(new { message = "Lote não encontrado" });
        }

        if (await _context.Lotes.AnyAsync(l => l.CodigoLote == loteDto.CodigoLote && l.NumLote != id))
        {
            return Conflict(new { message = "Código de lote já cadastrado" });
        }

        // Preço de compra é IMUTÁVEL
        var precoCompraOriginal = lote.PrecoCompra;

        _mapper.Map(loteDto, lote);
        lote.PrecoCompra = precoCompraOriginal;

        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<LoteDto>(lote));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLote(int id)
    {
        var lote = await _context.Lotes.FindAsync(id);

        if (lote == null)
        {
            return NotFound(new { message = "Lote não encontrado" });
        }

        // Verificar se há agendamentos vinculados
        var hasAgendamentos = await _context.Agendamentos.AnyAsync(a => a.LoteNumLote == id);
        if (hasAgendamentos)
        {
            return Conflict(new { message = "Não é possível excluir lote com agendamentos vinculados" });
        }

        _context.Lotes.Remove(lote);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("vencendo")]
    public async Task<ActionResult<IEnumerable<LoteDto>>> GetLotesVencendo([FromQuery] int dias = 30)
    {
        var dataLimite = DateTime.Today.AddDays(dias);

        var lotesVencendo = await _context.Lotes
            .Include(l => l.Vacina)
            .Where(l => l.DataValidade <= dataLimite && l.QuantidadeDisponivel > 0)
            .OrderBy(l => l.DataValidade)
            .ToListAsync();

        return Ok(_mapper.Map<List<LoteDto>>(lotesVencendo));
    }
}
