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
public class ClientesController : ControllerBase
{
    private readonly VixClinicContext _context;
    private readonly IMapper _mapper;

    public ClientesController(VixClinicContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> GetClientes()
    {
        var clientes = await _context.Clientes.ToListAsync();
        return Ok(_mapper.Map<List<ClienteDto>>(clientes));
    }

    [HttpGet("{cpf}")]
    public async Task<ActionResult<ClienteDto>> GetCliente(string cpf)
    {
        var cpfFormatado = CpfFormatter.Format(cpf);
        var cliente = await _context.Clientes.FindAsync(cpfFormatado);

        if (cliente == null)
        {
            return NotFound(new { message = "Cliente não encontrado" });
        }

        return Ok(_mapper.Map<ClienteDto>(cliente));
    }

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> CreateCliente([FromBody] ClienteDto clienteDto)
    {
        var cpfFormatado = CpfFormatter.Format(clienteDto.Cpf!);

        if (await _context.Clientes.AnyAsync(c => c.Cpf == cpfFormatado))
        {
            return Conflict(new { message = "Cliente com este CPF já existe" });
        }

        if (!string.IsNullOrWhiteSpace(clienteDto.Email) && 
            await _context.Clientes.AnyAsync(c => c.Email == clienteDto.Email))
        {
            return Conflict(new { message = "Email já cadastrado" });
        }

        var cliente = _mapper.Map<Cliente>(clienteDto);
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCliente), new { cpf = cliente.Cpf }, _mapper.Map<ClienteDto>(cliente));
    }

    [HttpPut("{cpf}")]
    public async Task<ActionResult<ClienteDto>> UpdateCliente(string cpf, [FromBody] ClienteDto clienteDto)
    {
        var cpfFormatado = CpfFormatter.Format(cpf);
        var cliente = await _context.Clientes.FindAsync(cpfFormatado);

        if (cliente == null)
        {
            return NotFound(new { message = "Cliente não encontrado" });
        }

        if (!string.IsNullOrWhiteSpace(clienteDto.Email) &&
            await _context.Clientes.AnyAsync(c => c.Email == clienteDto.Email && c.Cpf != cpfFormatado))
        {
            return Conflict(new { message = "Email já cadastrado para outro cliente" });
        }

        _mapper.Map(clienteDto, cliente);
        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<ClienteDto>(cliente));
    }

    [HttpDelete("{cpf}")]
    public async Task<IActionResult> DeleteCliente(string cpf)
    {
        var cpfFormatado = CpfFormatter.Format(cpf);
        var cliente = await _context.Clientes.FindAsync(cpfFormatado);

        if (cliente == null)
        {
            return NotFound(new { message = "Cliente não encontrado" });
        }

        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var totalClientes = await _context.Clientes.CountAsync();
        var clientesAtivos = await _context.Clientes
            .CountAsync(c => c.Status == Core.Enums.ClienteStatus.ATIVO);
        var clientesInativos = await _context.Clientes
            .CountAsync(c => c.Status == Core.Enums.ClienteStatus.INATIVO);

        return Ok(new
        {
            total = totalClientes,
            ativos = clientesAtivos,
            inativos = clientesInativos
        });
    }
}
