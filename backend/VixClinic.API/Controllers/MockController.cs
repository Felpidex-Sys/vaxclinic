using Microsoft.AspNetCore.Mvc;
using VixClinic.Application.DTOs;
using VixClinic.Core.Enums;

namespace VixClinic.API.Controllers;

/// <summary>
/// Controller temporário para testar frontend SEM banco de dados
/// REMOVER quando banco estiver configurado!
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MockController : ControllerBase
{
    // Dados mock em memória
    private static readonly List<ClienteDto> MockClientes = new()
    {
        new ClienteDto
        {
            Cpf = "123.456.789-00",
            NomeCompleto = "João da Silva",
            Email = "joao@email.com",
            Telefone = "(11) 98765-4321",
            DataNasc = new DateTime(1990, 5, 15),
            Status = ClienteStatus.ATIVO
        },
        new ClienteDto
        {
            Cpf = "987.654.321-00",
            NomeCompleto = "Maria Santos",
            Email = "maria@email.com",
            Telefone = "(11) 99876-5432",
            DataNasc = new DateTime(1985, 8, 20),
            Status = ClienteStatus.ATIVO
        }
    };

    private static readonly List<FuncionarioDto> MockFuncionarios = new()
    {
        new FuncionarioDto
        {
            IdFuncionario = 1,
            NomeCompleto = "Admin Sistema",
            Cpf = "111.222.333-44",
            Email = "admin@vixclinic.com",
            Cargo = "Administrador",
            Status = FuncionarioStatus.ATIVO,
            DataAdmissao = new DateTime(2024, 1, 1)
        },
        new FuncionarioDto
        {
            IdFuncionario = 2,
            NomeCompleto = "Dr. Carlos Oliveira",
            Cpf = "555.666.777-88",
            Email = "carlos@vixclinic.com",
            Cargo = "Médico",
            Status = FuncionarioStatus.ATIVO,
            DataAdmissao = new DateTime(2024, 3, 15)
        }
    };

    private static readonly List<VacinaDto> MockVacinas = new()
    {
        new VacinaDto
        {
            IdVacina = 1,
            Nome = "Vacina COVID-19",
            Fabricante = "Pfizer",
            Categoria = VacinaCategoria.VIRAL,
            QuantidadeDoses = 2,
            IntervaloDoses = 21,
            Status = VacinaStatus.ATIVA
        },
        new VacinaDto
        {
            IdVacina = 2,
            Nome = "Vacina Influenza",
            Fabricante = "Butantan",
            Categoria = VacinaCategoria.VIRAL,
            QuantidadeDoses = 1,
            IntervaloDoses = 0,
            Status = VacinaStatus.ATIVA
        }
    };

    // ==================== AUTH ====================
    [HttpPost("login")]
    public ActionResult<LoginResponseDto> Login([FromBody] LoginDto loginDto)
    {
        // Aceitar qualquer login para teste
        if (string.IsNullOrWhiteSpace(loginDto.Email) || string.IsNullOrWhiteSpace(loginDto.Password))
        {
            return BadRequest(new { message = "Email e senha são obrigatórios" });
        }

        // Mock de usuário
        var user = new UserInfoDto
        {
            Id = 1,
            Nome = "Admin Sistema",
            Email = loginDto.Email,
            Cargo = "Administrador"
        };

        // Token fake (válido por 60min)
        var token = "mock_token_" + Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(loginDto.Email));

        return Ok(new LoginResponseDto
        {
            Token = token,
            User = user
        });
    }

    // ==================== CLIENTES ====================
    [HttpGet("clientes")]
    public ActionResult<IEnumerable<ClienteDto>> GetClientes()
    {
        return Ok(MockClientes);
    }

    [HttpGet("clientes/{cpf}")]
    public ActionResult<ClienteDto> GetCliente(string cpf)
    {
        var cliente = MockClientes.FirstOrDefault(c => c.Cpf == cpf);
        if (cliente == null)
            return NotFound(new { message = "Cliente não encontrado" });

        return Ok(cliente);
    }

    [HttpPost("clientes")]
    public ActionResult<ClienteDto> CreateCliente([FromBody] ClienteDto cliente)
    {
        cliente.Cpf ??= $"{Random.Shared.Next(100, 999)}.{Random.Shared.Next(100, 999)}.{Random.Shared.Next(100, 999)}-{Random.Shared.Next(10, 99)}";
        MockClientes.Add(cliente);
        return CreatedAtAction(nameof(GetCliente), new { cpf = cliente.Cpf }, cliente);
    }

    [HttpPut("clientes/{cpf}")]
    public ActionResult<ClienteDto> UpdateCliente(string cpf, [FromBody] ClienteDto clienteDto)
    {
        var index = MockClientes.FindIndex(c => c.Cpf == cpf);
        if (index == -1)
            return NotFound(new { message = "Cliente não encontrado" });

        clienteDto.Cpf = cpf;
        MockClientes[index] = clienteDto;
        return Ok(clienteDto);
    }

    [HttpDelete("clientes/{cpf}")]
    public IActionResult DeleteCliente(string cpf)
    {
        var index = MockClientes.FindIndex(c => c.Cpf == cpf);
        if (index == -1)
            return NotFound(new { message = "Cliente não encontrado" });

        MockClientes.RemoveAt(index);
        return NoContent();
    }

    [HttpGet("clientes/stats")]
    public ActionResult GetClientesStats()
    {
        return Ok(new
        {
            total = MockClientes.Count,
            ativos = MockClientes.Count(c => c.Status == ClienteStatus.ATIVO),
            inativos = MockClientes.Count(c => c.Status == ClienteStatus.INATIVO)
        });
    }

    // ==================== FUNCIONARIOS ====================
    [HttpGet("funcionarios")]
    public ActionResult<IEnumerable<FuncionarioDto>> GetFuncionarios()
    {
        return Ok(MockFuncionarios);
    }

    [HttpGet("funcionarios/{id}")]
    public ActionResult<FuncionarioDto> GetFuncionario(int id)
    {
        var funcionario = MockFuncionarios.FirstOrDefault(f => f.IdFuncionario == id);
        if (funcionario == null)
            return NotFound(new { message = "Funcionário não encontrado" });

        return Ok(funcionario);
    }

    [HttpPost("funcionarios")]
    public ActionResult<FuncionarioDto> CreateFuncionario([FromBody] FuncionarioDto funcionario)
    {
        funcionario.IdFuncionario = MockFuncionarios.Max(f => f.IdFuncionario ?? 0) + 1;
        MockFuncionarios.Add(funcionario);
        return CreatedAtAction(nameof(GetFuncionario), new { id = funcionario.IdFuncionario }, funcionario);
    }

    [HttpGet("funcionarios/stats")]
    public ActionResult GetFuncionariosStats()
    {
        return Ok(new
        {
            total = MockFuncionarios.Count,
            ativos = MockFuncionarios.Count(f => f.Status == FuncionarioStatus.ATIVO),
            inativos = MockFuncionarios.Count(f => f.Status == FuncionarioStatus.INATIVO)
        });
    }

    // ==================== VACINAS ====================
    [HttpGet("vacinas")]
    public ActionResult<IEnumerable<VacinaDto>> GetVacinas()
    {
        return Ok(MockVacinas);
    }

    [HttpGet("vacinas/{id}")]
    public ActionResult<VacinaDto> GetVacina(int id)
    {
        var vacina = MockVacinas.FirstOrDefault(v => v.IdVacina == id);
        if (vacina == null)
            return NotFound(new { message = "Vacina não encontrada" });

        return Ok(vacina);
    }

    [HttpPost("vacinas")]
    public ActionResult<VacinaDto> CreateVacina([FromBody] VacinaDto vacina)
    {
        vacina.IdVacina = MockVacinas.Max(v => v.IdVacina ?? 0) + 1;
        MockVacinas.Add(vacina);
        return CreatedAtAction(nameof(GetVacina), new { id = vacina.IdVacina }, vacina);
    }

    [HttpGet("vacinas/stats")]
    public ActionResult GetVacinasStats()
    {
        return Ok(new
        {
            total = MockVacinas.Count,
            ativas = MockVacinas.Count(v => v.Status == VacinaStatus.ATIVA),
            inativas = MockVacinas.Count(v => v.Status == VacinaStatus.INATIVA)
        });
    }

    // ==================== DASHBOARD ====================
    [HttpGet("dashboard/stats")]
    public ActionResult GetDashboardStats()
    {
        return Ok(new
        {
            clientes = new
            {
                total = MockClientes.Count,
                ativos = MockClientes.Count(c => c.Status == ClienteStatus.ATIVO)
            },
            vacinas = new
            {
                total = MockVacinas.Count,
                ativas = MockVacinas.Count(v => v.Status == VacinaStatus.ATIVA)
            },
            agendamentos = new
            {
                total = 0,
                hoje = 0,
                pendentes = 0
            },
            aplicacoes = new
            {
                total = 0,
                hoje = 0
            },
            estoque = new
            {
                total = 0,
                lotesVencendo = 0
            }
        });
    }

    [HttpGet("dashboard/lotes-vencendo")]
    public ActionResult GetLotesVencendo([FromQuery] int dias = 30)
    {
        return Ok(new List<object>());
    }

    [HttpGet("dashboard/aplicacoes-recentes")]
    public ActionResult GetAplicacoesRecentes([FromQuery] int limite = 10)
    {
        return Ok(new List<object>());
    }
}
