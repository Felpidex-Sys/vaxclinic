using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VixClinic.Infrastructure.Data;

namespace VixClinic.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly VixClinicContext _context;

    public DashboardController(VixClinicContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var totalClientes = await _context.Clientes.CountAsync();
        var totalVacinas = await _context.Vacinas.CountAsync();
        var totalAgendamentos = await _context.Agendamentos.CountAsync();
        var totalAplicacoes = await _context.Aplicacoes.CountAsync();

        var agendamentosHoje = await _context.Agendamentos
            .Where(a => a.DataAgendada.Date == DateTime.Today)
            .CountAsync();

        var aplicacoesHoje = await _context.Aplicacoes
            .Where(a => a.DataAplicacao.Date == DateTime.Today)
            .CountAsync();

        var lotesVencendo = await _context.Lotes
            .Where(l => l.DataValidade <= DateTime.Today.AddDays(30) && l.QuantidadeDisponivel > 0)
            .CountAsync();

        var estoqueTotal = await _context.Lotes
            .SumAsync(l => l.QuantidadeDisponivel);

        return Ok(new
        {
            clientes = new
            {
                total = totalClientes,
                ativos = await _context.Clientes.CountAsync(c => c.Status == Core.Enums.ClienteStatus.ATIVO)
            },
            vacinas = new
            {
                total = totalVacinas,
                ativas = await _context.Vacinas.CountAsync(v => v.Status == Core.Enums.VacinaStatus.ATIVA)
            },
            agendamentos = new
            {
                total = totalAgendamentos,
                hoje = agendamentosHoje,
                pendentes = await _context.Agendamentos.CountAsync(a => a.Status == Core.Enums.AgendamentoStatus.AGENDADO)
            },
            aplicacoes = new
            {
                total = totalAplicacoes,
                hoje = aplicacoesHoje
            },
            estoque = new
            {
                total = estoqueTotal,
                lotesVencendo = lotesVencendo
            }
        });
    }

    [HttpGet("lotes-vencendo")]
    public async Task<ActionResult> GetLotesVencendo([FromQuery] int dias = 30)
    {
        var dataLimite = DateTime.Today.AddDays(dias);

        var lotesVencendo = await _context.Lotes
            .Include(l => l.Vacina)
            .Where(l => l.DataValidade <= dataLimite && l.QuantidadeDisponivel > 0)
            .OrderBy(l => l.DataValidade)
            .Select(l => new
            {
                l.NumLote,
                l.CodigoLote,
                l.DataValidade,
                l.QuantidadeDisponivel,
                Vacina = l.Vacina!.Nome,
                DiasParaVencer = (l.DataValidade - DateTime.Today).Days
            })
            .ToListAsync();

        return Ok(lotesVencendo);
    }

    [HttpGet("aplicacoes-recentes")]
    public async Task<ActionResult> GetAplicacoesRecentes([FromQuery] int limite = 10)
    {
        var aplicacoesRecentes = await _context.Aplicacoes
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Agendamento)
                .ThenInclude(ag => ag!.Lote)
                    .ThenInclude(l => l!.Vacina)
            .OrderByDescending(a => a.DataAplicacao)
            .Take(limite)
            .Select(a => new
            {
                a.IdAplicacao,
                a.DataAplicacao,
                a.Dose,
                Cliente = a.Cliente.NomeCompleto,
                ClienteCpf = a.ClienteCpf,
                Funcionario = a.Funcionario.NomeCompleto,
                Vacina = a.Agendamento != null ? a.Agendamento.Lote!.Vacina!.Nome : null
            })
            .ToListAsync();

        return Ok(aplicacoesRecentes);
    }
}
