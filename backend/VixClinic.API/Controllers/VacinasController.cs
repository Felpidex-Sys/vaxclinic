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
public class VacinasController : ControllerBase
{
    private readonly VixClinicContext _context;
    private readonly IMapper _mapper;

    public VacinasController(VixClinicContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VacinaDto>>> GetVacinas()
    {
        var vacinas = await _context.Vacinas.ToListAsync();
        return Ok(_mapper.Map<List<VacinaDto>>(vacinas));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VacinaDto>> GetVacina(int id)
    {
        var vacina = await _context.Vacinas.FindAsync(id);

        if (vacina == null)
        {
            return NotFound(new { message = "Vacina não encontrada" });
        }

        return Ok(_mapper.Map<VacinaDto>(vacina));
    }

    [HttpPost]
    public async Task<ActionResult<VacinaDto>> CreateVacina([FromBody] VacinaDto vacinaDto)
    {
        var vacina = _mapper.Map<Vacina>(vacinaDto);
        _context.Vacinas.Add(vacina);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetVacina), new { id = vacina.IdVacina }, 
            _mapper.Map<VacinaDto>(vacina));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<VacinaDto>> UpdateVacina(int id, [FromBody] VacinaDto vacinaDto)
    {
        var vacina = await _context.Vacinas.FindAsync(id);

        if (vacina == null)
        {
            return NotFound(new { message = "Vacina não encontrada" });
        }

        _mapper.Map(vacinaDto, vacina);
        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<VacinaDto>(vacina));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVacina(int id)
    {
        var vacina = await _context.Vacinas.FindAsync(id);

        if (vacina == null)
        {
            return NotFound(new { message = "Vacina não encontrada" });
        }

        // Verificar se há lotes vinculados
        var hasLotes = await _context.Lotes.AnyAsync(l => l.VacinaId == id);
        if (hasLotes)
        {
            return Conflict(new { message = "Não é possível excluir vacina com lotes vinculados" });
        }

        _context.Vacinas.Remove(vacina);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var totalVacinas = await _context.Vacinas.CountAsync();
        var vacinasAtivas = await _context.Vacinas
            .CountAsync(v => v.Status == Core.Enums.VacinaStatus.ATIVA);
        var vacinasInativas = await _context.Vacinas
            .CountAsync(v => v.Status == Core.Enums.VacinaStatus.INATIVA);

        return Ok(new
        {
            total = totalVacinas,
            ativas = vacinasAtivas,
            inativas = vacinasInativas
        });
    }
}
