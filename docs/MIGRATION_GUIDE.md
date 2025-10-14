# 🚀 Guia de Migração para C# - VixClinic

## 📋 Visão Geral

Este documento fornece um guia completo e prático para migrar o sistema VixClinic de **React + Supabase** para **ASP.NET Core + PostgreSQL**, mantendo **100% da funcionalidade** existente.

---

## 🛠️ Stack Tecnológica Recomendada

### Backend (C#)

| Componente | Tecnologia | Versão | Propósito |
|------------|-----------|--------|-----------|
| **Framework** | ASP.NET Core | 8.0 | Web API REST |
| **ORM** | Entity Framework Core | 8.0 | Mapeamento objeto-relacional |
| **Banco de Dados** | PostgreSQL | 15+ | Database (compatível com Supabase) |
| **Provedor EF** | Npgsql.EntityFrameworkCore.PostgreSQL | 8.0 | Driver PostgreSQL para EF |
| **Validação** | FluentValidation | 11.9 | Validação de DTOs |
| **Hash de Senha** | BCrypt.Net-Next | 4.0 | Hash bcrypt de senhas |
| **Autenticação** | Microsoft.AspNetCore.Authentication.JwtBearer | 8.0 | JWT tokens |
| **Mapeamento** | AutoMapper | 12.0 | Mapeamento entre DTOs e entidades |
| **Logging** | Serilog | 3.1 | Logging estruturado |
| **Testes** | xUnit + Moq | 2.6 / 4.20 | Testes unitários e mocks |

### Frontend (React) - Mantido

| Componente | Tecnologia | Versão | Mudanças |
|------------|-----------|--------|----------|
| **Framework** | React + Vite | 18.3 | Sem mudanças |
| **HTTP Client** | Axios ou Fetch | - | Substituir `supabase.from()` por `axios.get()` |
| **Autenticação** | JWT | - | Armazenar token no localStorage |
| **State Management** | React Query | 5.0 | Manter |
| **Validação** | Zod + React Hook Form | 3.25 / 7.61 | Manter |

---

## 📁 Estrutura de Projeto C#

```
VixClinic/
├── VixClinic.API/                    # Web API
│   ├── Controllers/                  # Controllers REST
│   │   ├── AuthController.cs
│   │   ├── ClientesController.cs
│   │   ├── FuncionariosController.cs
│   │   ├── VacinasController.cs
│   │   ├── LotesController.cs
│   │   ├── AgendamentosController.cs
│   │   ├── AplicacoesController.cs
│   │   └── DashboardController.cs
│   ├── Middleware/                   # Middlewares personalizados
│   │   ├── ErrorHandlingMiddleware.cs
│   │   └── JwtMiddleware.cs
│   ├── Program.cs                    # Configuração da aplicação
│   └── appsettings.json              # Configurações
│
├── VixClinic.Core/                   # Camada de domínio
│   ├── Entities/                     # Entidades do banco
│   │   ├── Cliente.cs
│   │   ├── Funcionario.cs
│   │   ├── Vacina.cs
│   │   ├── Lote.cs
│   │   ├── Agendamento.cs
│   │   ├── Aplicacao.cs
│   │   └── HistoricoAplicacoesCliente.cs
│   ├── Enums/                        # Enums
│   │   ├── ClienteStatus.cs
│   │   ├── FuncionarioStatus.cs
│   │   ├── VacinaStatus.cs
│   │   ├── VacinaCategoria.cs
│   │   └── AgendamentoStatus.cs
│   └── Interfaces/                   # Interfaces de repositórios
│       ├── IClienteRepository.cs
│       ├── IFuncionarioRepository.cs
│       └── ...
│
├── VixClinic.Application/            # Camada de aplicação
│   ├── DTOs/                         # Data Transfer Objects
│   │   ├── ClienteDto.cs
│   │   ├── FuncionarioDto.cs
│   │   ├── VacinaDto.cs
│   │   ├── LoteDto.cs
│   │   ├── AgendamentoDto.cs
│   │   ├── AplicacaoDto.cs
│   │   └── AuthDtos.cs
│   ├── Services/                     # Serviços de negócio
│   │   ├── IAuthService.cs
│   │   ├── AuthService.cs
│   │   ├── IClienteService.cs
│   │   ├── ClienteService.cs
│   │   └── ...
│   ├── Validators/                   # FluentValidation validators
│   │   ├── ClienteValidator.cs
│   │   ├── FuncionarioValidator.cs
│   │   └── ...
│   ├── Mappings/                     # AutoMapper profiles
│   │   └── MappingProfile.cs
│   └── Helpers/                      # Helpers e utilitários
│       ├── PasswordHasher.cs
│       ├── JwtService.cs
│       ├── CpfFormatter.cs
│       └── TelefoneFormatter.cs
│
├── VixClinic.Infrastructure/         # Camada de infraestrutura
│   ├── Data/                         # Contexto EF Core
│   │   ├── VixClinicContext.cs
│   │   └── Configurations/           # Configurações de entidades
│   │       ├── ClienteConfiguration.cs
│   │       ├── FuncionarioConfiguration.cs
│   │       └── ...
│   ├── Repositories/                 # Implementação de repositórios
│   │   ├── ClienteRepository.cs
│   │   ├── FuncionarioRepository.cs
│   │   └── ...
│   └── Migrations/                   # Migrações EF Core
│       └── [timestamp]_InitialCreate.cs
│
└── VixClinic.Tests/                  # Testes
    ├── Unit/                         # Testes unitários
    │   ├── Services/
    │   ├── Validators/
    │   └── Helpers/
    └── Integration/                  # Testes de integração
        └── Controllers/
```

---

## 🔧 Setup Inicial do Projeto

### 1. Criar Solução e Projetos

```bash
# Criar solução
dotnet new sln -n VixClinic

# Criar projetos
dotnet new webapi -n VixClinic.API
dotnet new classlib -n VixClinic.Core
dotnet new classlib -n VixClinic.Application
dotnet new classlib -n VixClinic.Infrastructure
dotnet new xunit -n VixClinic.Tests

# Adicionar projetos à solução
dotnet sln add VixClinic.API/VixClinic.API.csproj
dotnet sln add VixClinic.Core/VixClinic.Core.csproj
dotnet sln add VixClinic.Application/VixClinic.Application.csproj
dotnet sln add VixClinic.Infrastructure/VixClinic.Infrastructure.csproj
dotnet sln add VixClinic.Tests/VixClinic.Tests.csproj

# Adicionar referências entre projetos
cd VixClinic.API
dotnet add reference ../VixClinic.Application/VixClinic.Application.csproj
dotnet add reference ../VixClinic.Infrastructure/VixClinic.Infrastructure.csproj

cd ../VixClinic.Application
dotnet add reference ../VixClinic.Core/VixClinic.Core.csproj

cd ../VixClinic.Infrastructure
dotnet add reference ../VixClinic.Core/VixClinic.Core.csproj

cd ../VixClinic.Tests
dotnet add reference ../VixClinic.API/VixClinic.API.csproj
dotnet add reference ../VixClinic.Application/VixClinic.Application.csproj
```

### 2. Instalar Pacotes NuGet

```bash
# VixClinic.API
cd VixClinic.API
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.0
dotnet add package Microsoft.AspNetCore.OpenApi --version 8.0.0
dotnet add package Swashbuckle.AspNetCore --version 6.5.0
dotnet add package Serilog.AspNetCore --version 8.0.0

# VixClinic.Application
cd ../VixClinic.Application
dotnet add package AutoMapper --version 12.0.1
dotnet add package FluentValidation --version 11.9.0
dotnet add package FluentValidation.DependencyInjectionExtensions --version 11.9.0
dotnet add package BCrypt.Net-Next --version 4.0.3

# VixClinic.Infrastructure
cd ../VixClinic.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0

# VixClinic.Tests
cd ../VixClinic.Tests
dotnet add package Moq --version 4.20.70
dotnet add package FluentAssertions --version 6.12.0
```

---

## 💾 Configuração do Banco de Dados

### 1. Connection String

**appsettings.json**:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=vixclinic;Username=postgres;Password=suasenha"
  },
  "Jwt": {
    "SecretKey": "sua-chave-secreta-muito-segura-com-no-minimo-32-caracteres",
    "Issuer": "VixClinic",
    "Audience": "VixClinicAPI",
    "ExpiryMinutes": 60
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### 2. Script SQL de Criação do Banco

**Database/CreateDatabase.sql**:
```sql
-- ========================================
-- VIXCLINIC DATABASE CREATION SCRIPT
-- PostgreSQL 15+
-- ========================================

-- 1. CRIAR ENUMS
CREATE TYPE agendamento_status AS ENUM ('AGENDADO', 'REALIZADO');
CREATE TYPE cliente_status AS ENUM ('ATIVO', 'INATIVO');
CREATE TYPE funcionario_status AS ENUM ('ATIVO', 'INATIVO');
CREATE TYPE vacina_categoria AS ENUM ('VIRAL', 'BACTERIANA', 'OUTRA');
CREATE TYPE vacina_status AS ENUM ('ATIVA', 'INATIVA');

-- 2. CRIAR TABELAS

-- Tabela: cliente
CREATE TABLE public.cliente (
    cpf VARCHAR(11) PRIMARY KEY,
    nomecompleto VARCHAR(255) NOT NULL,
    datanasc DATE,
    email VARCHAR(255),
    telefone VARCHAR(11),
    alergias TEXT,
    observacoes TEXT,
    status cliente_status NOT NULL DEFAULT 'ATIVO'
);

-- Tabela: funcionario
CREATE TABLE public.funcionario (
    idfuncionario SERIAL PRIMARY KEY,
    nomecompleto VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(11),
    cargo VARCHAR(100),
    senha VARCHAR(255) NOT NULL,
    status funcionario_status NOT NULL DEFAULT 'ATIVO',
    dataadmissao DATE
);

-- Tabela: vacina
CREATE TABLE public.vacina (
    idvacina SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    fabricante VARCHAR(255),
    categoria vacina_categoria,
    quantidadedoses INTEGER CHECK (quantidadedoses > 0),
    intervalodoses INTEGER CHECK (intervalodoses >= 0),
    descricao TEXT,
    status vacina_status NOT NULL DEFAULT 'ATIVA'
);

-- Tabela: lote
CREATE TABLE public.lote (
    numlote SERIAL PRIMARY KEY,
    codigolote VARCHAR(100) NOT NULL UNIQUE,
    quantidadeinicial INTEGER NOT NULL CHECK (quantidadeinicial >= 0),
    quantidadedisponivel INTEGER NOT NULL CHECK (quantidadedisponivel >= 0),
    datavalidade DATE NOT NULL,
    precocompra NUMERIC(10,2) NOT NULL DEFAULT 0,
    precovenda NUMERIC(10,2) NOT NULL DEFAULT 0,
    vacina_idvacina INTEGER NOT NULL REFERENCES vacina(idvacina) ON DELETE CASCADE
);

-- Tabela: agendamento
CREATE TABLE public.agendamento (
    idagendamento SERIAL PRIMARY KEY,
    dataagendada TIMESTAMP NOT NULL,
    status agendamento_status NOT NULL DEFAULT 'AGENDADO',
    observacoes TEXT,
    cliente_cpf VARCHAR(11) NOT NULL REFERENCES cliente(cpf) ON DELETE CASCADE,
    funcionario_idfuncionario INTEGER REFERENCES funcionario(idfuncionario) ON DELETE SET NULL,
    lote_numlote INTEGER NOT NULL REFERENCES lote(numlote) ON DELETE RESTRICT
);

-- Tabela: aplicacao
CREATE TABLE public.aplicacao (
    idaplicacao SERIAL PRIMARY KEY,
    dataaplicacao DATE NOT NULL,
    dose INTEGER CHECK (dose > 0),
    reacoesadversas TEXT,
    observacoes TEXT,
    funcionario_idfuncionario INTEGER NOT NULL REFERENCES funcionario(idfuncionario) ON DELETE RESTRICT,
    cliente_cpf VARCHAR(11) NOT NULL REFERENCES cliente(cpf) ON DELETE RESTRICT,
    agendamento_idagendamento INTEGER REFERENCES agendamento(idagendamento) ON DELETE SET NULL
);

-- Tabela: historico_aplicacoes_cliente
CREATE TABLE public.historico_aplicacoes_cliente (
    idhistorico SERIAL PRIMARY KEY,
    cliente_cpf_deletado VARCHAR(11) NOT NULL,
    idaplicacao_hist INTEGER NOT NULL,
    dataaplicacao_hist DATE,
    dose_hist INTEGER,
    idagendamento_hist INTEGER,
    idfuncionario_hist INTEGER,
    data_exclusao_cliente TIMESTAMP
);

-- 3. CRIAR ÍNDICES

-- Cliente
CREATE INDEX idx_cliente_nome ON cliente(nomecompleto);
CREATE INDEX idx_cliente_status ON cliente(status);

-- Funcionario
CREATE UNIQUE INDEX idx_funcionario_email ON funcionario(email);
CREATE UNIQUE INDEX idx_funcionario_cpf ON funcionario(cpf);
CREATE INDEX idx_funcionario_status ON funcionario(status);

-- Vacina
CREATE INDEX idx_vacina_nome ON vacina(nome);
CREATE INDEX idx_vacina_status ON vacina(status);
CREATE INDEX idx_vacina_categoria ON vacina(categoria);

-- Lote
CREATE UNIQUE INDEX idx_lote_codigo ON lote(codigolote);
CREATE INDEX idx_lote_vacina ON lote(vacina_idvacina);
CREATE INDEX idx_lote_validade ON lote(datavalidade);
CREATE INDEX idx_lote_disponivel ON lote(quantidadedisponivel);

-- Agendamento
CREATE INDEX idx_agendamento_data ON agendamento(dataagendada);
CREATE INDEX idx_agendamento_status ON agendamento(status);
CREATE INDEX idx_agendamento_cliente ON agendamento(cliente_cpf);
CREATE INDEX idx_agendamento_lote ON agendamento(lote_numlote);

-- Aplicacao
CREATE INDEX idx_aplicacao_data ON aplicacao(dataaplicacao);
CREATE INDEX idx_aplicacao_cliente ON aplicacao(cliente_cpf);
CREATE INDEX idx_aplicacao_funcionario ON aplicacao(funcionario_idfuncionario);

-- Historico
CREATE INDEX idx_historico_cpf ON historico_aplicacoes_cliente(cliente_cpf_deletado);
CREATE INDEX idx_historico_data_exclusao ON historico_aplicacoes_cliente(data_exclusao_cliente);

-- 4. CRIAR FUNÇÕES E TRIGGERS

-- Função: valida_cliente
CREATE OR REPLACE FUNCTION public.valida_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.datanasc IS NOT NULL AND NEW.datanasc > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de nascimento não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_valida_cliente
BEFORE INSERT OR UPDATE ON public.cliente
FOR EACH ROW
EXECUTE FUNCTION public.valida_cliente();

-- Função: valida_funcionario
CREATE OR REPLACE FUNCTION public.valida_funcionario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.dataadmissao IS NOT NULL AND NEW.dataadmissao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de admissão não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_valida_funcionario
BEFORE INSERT OR UPDATE ON public.funcionario
FOR EACH ROW
EXECUTE FUNCTION public.valida_funcionario();

-- Função: valida_lote
CREATE OR REPLACE FUNCTION public.valida_lote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.datavalidade < CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de validade não pode ser anterior à data atual. Lote vencido.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_valida_lote
BEFORE INSERT OR UPDATE ON public.lote
FOR EACH ROW
EXECUTE FUNCTION public.valida_lote();

-- Função: valida_agendamento
CREATE OR REPLACE FUNCTION public.valida_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.dataagendada <= NOW() THEN
        RAISE EXCEPTION 'A data do agendamento deve ser no futuro.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_valida_agendamento
BEFORE INSERT OR UPDATE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.valida_agendamento();

-- Função: valida_aplicacao
CREATE OR REPLACE FUNCTION public.valida_aplicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.dataaplicacao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data da aplicação não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_valida_aplicacao
BEFORE INSERT OR UPDATE ON public.aplicacao
FOR EACH ROW
EXECUTE FUNCTION public.valida_aplicacao();

-- Função: reserva_estoque_ao_agendar
CREATE OR REPLACE FUNCTION public.reserva_estoque_ao_agendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    disponivel INT;
BEGIN
    SELECT quantidadedisponivel INTO disponivel 
    FROM public.lote 
    WHERE numlote = NEW.lote_numlote;
    
    IF disponivel <= 0 THEN
        RAISE EXCEPTION 'Não há vacinas disponíveis neste lote para agendamento.';
    ELSE
        UPDATE public.lote 
        SET quantidadedisponivel = quantidadedisponivel - 1 
        WHERE numlote = NEW.lote_numlote;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reserva_estoque
AFTER INSERT ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.reserva_estoque_ao_agendar();

-- Função: retorna_estoque_ao_cancelar
CREATE OR REPLACE FUNCTION public.retorna_estoque_ao_cancelar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF OLD.status = 'AGENDADO' THEN
        UPDATE public.lote 
        SET quantidadedisponivel = quantidadedisponivel + 1 
        WHERE numlote = OLD.lote_numlote;
    END IF;
    
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_retorna_estoque
BEFORE DELETE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.retorna_estoque_ao_cancelar();

-- Função: finaliza_agendamento_apos_aplicacao
CREATE OR REPLACE FUNCTION public.finaliza_agendamento_apos_aplicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.agendamento 
    SET status = 'REALIZADO' 
    WHERE idagendamento = NEW.agendamento_idagendamento;
    
    DELETE FROM public.agendamento 
    WHERE idagendamento = NEW.agendamento_idagendamento;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_finaliza_agendamento
AFTER INSERT ON public.aplicacao
FOR EACH ROW
EXECUTE FUNCTION public.finaliza_agendamento_apos_aplicacao();

-- Função: log_aplicacoes_antes_deletar_cliente
CREATE OR REPLACE FUNCTION public.log_aplicacoes_antes_deletar_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.historico_aplicacoes_cliente 
        (cliente_cpf_deletado, idaplicacao_hist, dataaplicacao_hist, 
         dose_hist, idagendamento_hist, idfuncionario_hist, data_exclusao_cliente)
    SELECT 
        OLD.cpf, 
        idaplicacao, 
        dataaplicacao, 
        dose, 
        agendamento_idagendamento, 
        funcionario_idfuncionario, 
        NOW()
    FROM public.aplicacao
    WHERE cliente_cpf = OLD.cpf;
    
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_log_aplicacoes
BEFORE DELETE ON public.cliente
FOR EACH ROW
EXECUTE FUNCTION public.log_aplicacoes_antes_deletar_cliente();
```

---

## 📝 Classes C# Equivalentes

### Enums

**VixClinic.Core/Enums/ClienteStatus.cs**:
```csharp
namespace VixClinic.Core.Enums
{
    public enum ClienteStatus
    {
        ATIVO,
        INATIVO
    }
}
```

**VixClinic.Core/Enums/FuncionarioStatus.cs**:
```csharp
namespace VixClinic.Core.Enums
{
    public enum FuncionarioStatus
    {
        ATIVO,
        INATIVO
    }
}
```

**VixClinic.Core/Enums/VacinaCategoria.cs**:
```csharp
namespace VixClinic.Core.Enums
{
    public enum VacinaCategoria
    {
        VIRAL,
        BACTERIANA,
        OUTRA
    }
}
```

**VixClinic.Core/Enums/VacinaStatus.cs**:
```csharp
namespace VixClinic.Core.Enums
{
    public enum VacinaStatus
    {
        ATIVA,
        INATIVA
    }
}
```

**VixClinic.Core/Enums/AgendamentoStatus.cs**:
```csharp
namespace VixClinic.Core.Enums
{
    public enum AgendamentoStatus
    {
        AGENDADO,
        REALIZADO
    }
}
```

---

### Entidades

**VixClinic.Core/Entities/Cliente.cs**:
```csharp
using VixClinic.Core.Enums;

namespace VixClinic.Core.Entities
{
    public class Cliente
    {
        public string Cpf { get; set; } = null!;
        public string NomeCompleto { get; set; } = null!;
        public DateTime? DataNasc { get; set; }
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public string? Alergias { get; set; }
        public string? Observacoes { get; set; }
        public ClienteStatus Status { get; set; } = ClienteStatus.ATIVO;
        
        // Navegação
        public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
        public ICollection<Aplicacao> Aplicacoes { get; set; } = new List<Aplicacao>();
    }
}
```

**VixClinic.Core/Entities/Funcionario.cs**:
```csharp
using VixClinic.Core.Enums;

namespace VixClinic.Core.Entities
{
    public class Funcionario
    {
        public int IdFuncionario { get; set; }
        public string NomeCompleto { get; set; } = null!;
        public string Cpf { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Telefone { get; set; }
        public string? Cargo { get; set; }
        public string Senha { get; set; } = null!;
        public FuncionarioStatus Status { get; set; } = FuncionarioStatus.ATIVO;
        public DateTime? DataAdmissao { get; set; }
        
        // Navegação
        public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
        public ICollection<Aplicacao> Aplicacoes { get; set; } = new List<Aplicacao>();
    }
}
```

**VixClinic.Core/Entities/Vacina.cs**:
```csharp
using VixClinic.Core.Enums;

namespace VixClinic.Core.Entities
{
    public class Vacina
    {
        public int IdVacina { get; set; }
        public string Nome { get; set; } = null!;
        public string? Fabricante { get; set; }
        public VacinaCategoria? Categoria { get; set; }
        public int? QuantidadeDoses { get; set; }
        public int? IntervaloDoses { get; set; }
        public string? Descricao { get; set; }
        public VacinaStatus Status { get; set; } = VacinaStatus.ATIVA;
        
        // Navegação
        public ICollection<Lote> Lotes { get; set; } = new List<Lote>();
    }
}
```

**VixClinic.Core/Entities/Lote.cs**:
```csharp
namespace VixClinic.Core.Entities
{
    public class Lote
    {
        public int NumLote { get; set; }
        public string CodigoLote { get; set; } = null!;
        public int QuantidadeInicial { get; set; }
        public int QuantidadeDisponivel { get; set; }
        public DateTime DataValidade { get; set; }
        public decimal PrecoCompra { get; set; }
        public decimal PrecoVenda { get; set; }
        public int VacinaId { get; set; }
        
        // Navegação
        public Vacina Vacina { get; set; } = null!;
        public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
    }
}
```

**VixClinic.Core/Entities/Agendamento.cs**:
```csharp
using VixClinic.Core.Enums;

namespace VixClinic.Core.Entities
{
    public class Agendamento
    {
        public int IdAgendamento { get; set; }
        public DateTime DataAgendada { get; set; }
        public AgendamentoStatus Status { get; set; } = AgendamentoStatus.AGENDADO;
        public string? Observacoes { get; set; }
        public string ClienteCpf { get; set; } = null!;
        public int? FuncionarioId { get; set; }
        public int LoteNumLote { get; set; }
        
        // Navegação
        public Cliente Cliente { get; set; } = null!;
        public Funcionario? Funcionario { get; set; }
        public Lote Lote { get; set; } = null!;
        public ICollection<Aplicacao> Aplicacoes { get; set; } = new List<Aplicacao>();
    }
}
```

**VixClinic.Core/Entities/Aplicacao.cs**:
```csharp
namespace VixClinic.Core.Entities
{
    public class Aplicacao
    {
        public int IdAplicacao { get; set; }
        public DateTime DataAplicacao { get; set; }
        public int? Dose { get; set; }
        public string? ReacoesAdversas { get; set; }
        public string? Observacoes { get; set; }
        public int FuncionarioId { get; set; }
        public string ClienteCpf { get; set; } = null!;
        public int? AgendamentoId { get; set; }
        
        // Navegação
        public Funcionario Funcionario { get; set; } = null!;
        public Cliente Cliente { get; set; } = null!;
        public Agendamento? Agendamento { get; set; }
    }
}
```

**VixClinic.Core/Entities/HistoricoAplicacoesCliente.cs**:
```csharp
namespace VixClinic.Core.Entities
{
    public class HistoricoAplicacoesCliente
    {
        public int IdHistorico { get; set; }
        public string ClienteCpfDeletado { get; set; } = null!;
        public int IdAplicacaoHist { get; set; }
        public DateTime? DataAplicacaoHist { get; set; }
        public int? DoseHist { get; set; }
        public int? IdAgendamentoHist { get; set; }
        public int? IdFuncionarioHist { get; set; }
        public DateTime? DataExclusaoCliente { get; set; }
    }
}
```

---

## 🔄 Ordem de Implementação (Passo a Passo)

### Fase 1: Setup e Banco de Dados (Dia 1)

1. ✅ Criar estrutura de projetos
2. ✅ Instalar pacotes NuGet
3. ✅ Criar banco PostgreSQL
4. ✅ Executar script SQL de criação
5. ✅ Criar entidades C#
6. ✅ Criar enums C#
7. ✅ Configurar DbContext

### Fase 2: Infraestrutura (Dia 2)

8. ✅ Configurar Entity Framework
9. ✅ Criar configurações de entidades (Fluent API)
10. ✅ Gerar primeira migration
11. ✅ Testar conexão com banco
12. ✅ Criar repositórios base

### Fase 3: Aplicação - Helpers (Dia 3)

13. ✅ Implementar PasswordHasher (BCrypt)
14. ✅ Implementar CpfFormatter
15. ✅ Implementar TelefoneFormatter
16. ✅ Implementar JwtService

### Fase 4: Aplicação - Validadores (Dia 4)

17. ✅ Criar ClienteValidator
18. ✅ Criar FuncionarioValidator
19. ✅ Criar VacinaValidator
20. ✅ Criar LoteValidator
21. ✅ Criar AgendamentoValidator
22. ✅ Criar AplicacaoValidator

### Fase 5: Aplicação - DTOs e Mapeamento (Dia 5)

23. ✅ Criar DTOs para todas as entidades
24. ✅ Configurar AutoMapper profiles
25. ✅ Testar mapeamentos

### Fase 6: Aplicação - Serviços (Dia 6-7)

26. ✅ Implementar AuthService (login, JWT)
27. ✅ Implementar ClienteService
28. ✅ Implementar FuncionarioService
29. ✅ Implementar VacinaService
30. ✅ Implementar LoteService
31. ✅ Implementar AgendamentoService
32. ✅ Implementar AplicacaoService

### Fase 7: API - Controllers (Dia 8-9)

33. ✅ Criar AuthController
34. ✅ Criar ClientesController
35. ✅ Criar FuncionariosController
36. ✅ Criar VacinasController
37. ✅ Criar LotesController
38. ✅ Criar AgendamentosController
39. ✅ Criar AplicacoesController
40. ✅ Criar DashboardController

### Fase 8: API - Segurança e Middleware (Dia 10)

41. ✅ Configurar JWT Authentication
42. ✅ Criar ErrorHandlingMiddleware
43. ✅ Configurar CORS
44. ✅ Configurar Swagger com JWT

### Fase 9: Testes (Dia 11-12)

45. ✅ Criar testes unitários para validators
46. ✅ Criar testes unitários para services
47. ✅ Criar testes de integração para controllers
48. ✅ Testar fluxos completos

### Fase 10: Frontend - Migração (Dia 13-14)

49. ✅ Substituir Supabase client por Axios/Fetch
50. ✅ Atualizar chamadas de API
51. ✅ Implementar armazenamento de JWT
52. ✅ Atualizar interceptors para adicionar token
53. ✅ Testar todas as funcionalidades

### Fase 11: Deploy e Documentação (Dia 15)

54. ✅ Configurar CI/CD
55. ✅ Deploy do backend
56. ✅ Deploy do frontend
57. ✅ Documentação final
58. ✅ Treinamento da equipe

---

## ✅ Checklist de Funcionalidades

Use este checklist para garantir que todas as funcionalidades foram migradas:

### Autenticação
- [ ] Login com email e senha
- [ ] Logout
- [ ] Refresh token JWT
- [ ] Verificação de senha com bcrypt
- [ ] Proteção de rotas por autenticação

### Clientes
- [ ] Listar todos os clientes
- [ ] Buscar cliente por CPF
- [ ] Criar novo cliente
- [ ] Atualizar cliente
- [ ] Deletar cliente (com histórico)
- [ ] Estatísticas de clientes
- [ ] Validação de CPF (11 dígitos)
- [ ] Formatação de CPF para exibição
- [ ] Validação de data de nascimento (não futura)
- [ ] Validação de email
- [ ] Validação de telefone (10-11 dígitos)

### Funcionários
- [ ] Listar todos os funcionários
- [ ] Buscar funcionário por ID
- [ ] Criar novo funcionário
- [ ] Atualizar funcionário
- [ ] Validação de email único
- [ ] Validação de CPF único
- [ ] Hash de senha com bcrypt
- [ ] Validação de data de admissão (não futura)
- [ ] Filtro por status (ATIVO/INATIVO)

### Vacinas
- [ ] Listar todas as vacinas
- [ ] Buscar vacina por ID
- [ ] Criar nova vacina
- [ ] Atualizar vacina
- [ ] Deletar vacina
- [ ] Estatísticas de vacinas (agendadas, disponíveis, total)
- [ ] Filtro por categoria (VIRAL, BACTERIANA, OUTRA)
- [ ] Filtro por status (ATIVA, INATIVA)

### Lotes
- [ ] Listar todos os lotes
- [ ] Buscar lote por ID
- [ ] Criar novo lote
- [ ] Atualizar lote
- [ ] Deletar lote
- [ ] Validação de código de lote único
- [ ] Validação de data de validade (não vencida)
- [ ] Preço de compra IMUTÁVEL após criação
- [ ] Preço de venda editável
- [ ] Controle de estoque automático
- [ ] Lotes vencendo (próximos 30 dias)

### Agendamentos
- [ ] Listar todos os agendamentos
- [ ] Buscar agendamento por ID
- [ ] Criar novo agendamento
- [ ] Atualizar agendamento
- [ ] Deletar agendamento (cancelar)
- [ ] Validação de data agendada (no futuro)
- [ ] Reserva de estoque ao criar agendamento
- [ ] Devolução de estoque ao cancelar agendamento
- [ ] Funcionário opcional ao criar agendamento
- [ ] Filtro por status (AGENDADO, REALIZADO)
- [ ] Filtro por data

### Aplicações
- [ ] Listar todas as aplicações
- [ ] Buscar aplicação por ID
- [ ] Criar nova aplicação
- [ ] Validação de data de aplicação (não futura)
- [ ] Finalização automática de agendamento ao criar aplicação
- [ ] Filtro por cliente CPF
- [ ] Filtro por data
- [ ] Aplicações recentes

### Dashboard
- [ ] Total de clientes
- [ ] Total de funcionários
- [ ] Total de vacinas
- [ ] Vacinações hoje
- [ ] Agendamentos hoje
- [ ] Lotes vencendo
- [ ] Aplicações recentes
- [ ] Agendamentos próximos

### Histórico
- [ ] Cópia automática de aplicações ao deletar cliente
- [ ] Visualização de histórico por CPF
- [ ] Listagem de todo o histórico

### Triggers (Executados automaticamente pelo PostgreSQL)
- [ ] `valida_cliente()` - Valida data de nascimento
- [ ] `valida_funcionario()` - Valida data de admissão
- [ ] `valida_lote()` - Valida data de validade
- [ ] `valida_agendamento()` - Valida data agendada
- [ ] `valida_aplicacao()` - Valida data de aplicação
- [ ] `reserva_estoque_ao_agendar()` - Decrementa estoque
- [ ] `retorna_estoque_ao_cancelar()` - Incrementa estoque
- [ ] `finaliza_agendamento_apos_aplicacao()` - Finaliza e deleta agendamento
- [ ] `log_aplicacoes_antes_deletar_cliente()` - Salva histórico

### Formatação e Utilitários
- [ ] Formatação de CPF (apenas números)
- [ ] Exibição de CPF (XXX.XXX.XXX-XX)
- [ ] Formatação de telefone (apenas números)
- [ ] Exibição de telefone ((XX) XXXXX-XXXX)
- [ ] Hash de senha com bcrypt
- [ ] Verificação de senha com bcrypt
- [ ] Geração de JWT token
- [ ] Validação de JWT token

---

## 🚨 Pontos Críticos de Atenção

### 1. **Preço de Compra Imutável**
- ❌ NUNCA permitir UPDATE do campo `precocompra` após criação do lote
- ✅ No controller, sempre manter o valor original:
  ```csharp
  lote.PrecoCompra = existingLote.PrecoCompra;
  ```

### 2. **Funcionário Opcional no Agendamento**
- ❌ NÃO tornar `funcionario_idfuncionario` obrigatório
- ✅ Permitir NULL ao criar agendamento
- ✅ Definir funcionário apenas ao registrar aplicação

### 3. **Controle de Estoque Automático**
- ✅ Triggers do PostgreSQL fazem o controle automático
- ❌ NÃO duplicar lógica no C# (confiar nos triggers)
- ⚠️ Capturar exceções dos triggers e exibir mensagens amigáveis

### 4. **Finalização de Agendamento**
- ✅ Ao criar aplicação com `agendamento_idagendamento`, o agendamento é automaticamente deletado
- ❌ NÃO tentar deletar manualmente no C#
- ⚠️ Agendamento só é deletado APÓS inserir aplicação (trigger AFTER INSERT)

### 5. **Histórico de Aplicações**
- ✅ Trigger salva aplicações automaticamente ao deletar cliente
- ❌ NÃO tentar salvar manualmente no C#
- ⚠️ Histórico é criado ANTES de deletar cliente (trigger BEFORE DELETE)

### 6. **Validação de Datas**
- ✅ Triggers validam datas automaticamente
- ✅ FluentValidation também valida no C# (validação dupla é boa prática)
- ⚠️ Capturar exceções dos triggers PostgreSQL e converter em mensagens amigáveis

### 7. **Hash de Senhas**
- ✅ SEMPRE usar BCrypt com 10 rounds
- ❌ NUNCA armazenar senha em texto plano
- ❌ NUNCA retornar senha em responses da API

### 8. **JWT Tokens**
- ✅ Chave secreta deve ter no mínimo 32 caracteres
- ✅ Armazenar chave no `appsettings.json` (ou variável de ambiente)
- ✅ Expiração recomendada: 60 minutos
- ✅ Implementar refresh token para renovação

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [ASP.NET Core](https://learn.microsoft.com/aspnet/core/)
- [Entity Framework Core](https://learn.microsoft.com/ef/core/)
- [FluentValidation](https://docs.fluentvalidation.net/)
- [AutoMapper](https://docs.automapper.org/)
- [BCrypt.Net](https://github.com/BcryptNet/bcrypt.net)

### Tutoriais Recomendados
- [JWT Authentication in ASP.NET Core](https://jasonwatmore.com/post/2022/01/07/net-6-jwt-authentication-tutorial-with-example-api)
- [Clean Architecture with EF Core](https://www.youtube.com/watch?v=dK4Yb6-LxAk)
- [PostgreSQL with EF Core](https://www.npgsql.org/efcore/)

---

**Documento gerado em**: 2025-10-14  
**Versão do Sistema**: 1.0.0  
**Estimativa de Migração**: 15 dias úteis (1 desenvolvedor full-time)
