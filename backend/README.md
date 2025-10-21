# VixClinic Backend (.NET 9)

Backend em C# para o sistema VixClinic - Gerenciamento de Clínica de Vacinação.

## 🏗️ Arquitetura

Solução dividida em 5 projetos seguindo **Clean Architecture**:

```
VixClinic/
├── VixClinic.API          # ASP.NET Core Web API
├── VixClinic.Core         # Entidades e Enums (domínio)
├── VixClinic.Application  # DTOs, Validators, Services
├── VixClinic.Infrastructure # EF Core, DbContext, Repositories
└── VixClinic.Tests        # Testes (xUnit)
```

## 🛠️ Stack Tecnológica

- **.NET 9.0**
- **ASP.NET Core** - Web API REST
- **Entity Framework Core 9** - ORM
- **PostgreSQL** - Banco de Dados
- **JWT** - Autenticação
- **BCrypt** - Hash de senhas
- **FluentValidation** - Validação de DTOs
- **AutoMapper** - Mapeamento objeto-objeto
- **Serilog** - Logging
- **Swagger** - Documentação da API

## 📦 Pré-requisitos

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [PostgreSQL 15+](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

## ⚙️ Configuração Inicial

### 1. Clone o repositório

```bash
git clone https://github.com/Felpidex-Sys/vaxclinic.git
cd vaxclinic/backend
```

### 2. Configure o banco de dados PostgreSQL

Crie um banco de dados chamado `vixclinic`:

```sql
CREATE DATABASE vixclinic;
```

Execute o script de criação do esquema (disponível em `/docs/DATABASE_SCHEMA.md`).

### 3. Configure a connection string

Edite `VixClinic.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=vixclinic;Username=postgres;Password=SUA_SENHA"
  }
}
```

### 4. Restaure os pacotes NuGet

```bash
dotnet restore
```

### 5. Execute as migrações do EF Core

```bash
cd VixClinic.API
dotnet ef database update
```

## 🚀 Executando o Projeto

### Modo Desenvolvimento

```bash
cd VixClinic.API
dotnet run
```

A API estará disponível em:
- **HTTP**: `http://localhost:5000`
- **HTTPS**: `https://localhost:5001`
- **Swagger**: `https://localhost:5001/swagger`

### Modo Produção

```bash
dotnet publish -c Release -o ./publish
cd publish
dotnet VixClinic.API.dll
```

## 📚 Documentação da API

Após executar o projeto, acesse:
- **Swagger UI**: `https://localhost:5001/swagger`

Ou consulte `/docs/API_ENDPOINTS.md` para documentação completa.

## 🧪 Testes

### Executar todos os testes

```bash
dotnet test
```

### Executar com cobertura

```bash
dotnet test /p:CollectCoverage=true
```

## 📁 Estrutura de Pastas

```
VixClinic.API/
├── Controllers/       # Controllers REST
├── Middleware/        # Middlewares personalizados
├── Program.cs         # Configuração da aplicação
└── appsettings.json   # Configurações

VixClinic.Core/
├── Entities/          # Entidades do domínio
└── Enums/             # Enumerações

VixClinic.Application/
├── DTOs/              # Data Transfer Objects
├── Validators/        # FluentValidation validators
├── Services/          # Serviços de negócio
├── Helpers/           # Utilitários (PasswordHasher, JwtService, etc.)
└── Mappings/          # AutoMapper profiles

VixClinic.Infrastructure/
├── Data/              # DbContext e configurações EF
├── Repositories/      # Implementações de repositórios
└── Migrations/        # Migrações do EF Core

VixClinic.Tests/
├── Unit/              # Testes unitários
└── Integration/       # Testes de integração
```

## 🔑 Variáveis de Ambiente (Produção)

Recomendado usar variáveis de ambiente em produção:

```bash
export ConnectionStrings__DefaultConnection="Host=prod-server;Port=5432;Database=vixclinic;Username=app;Password=***"
export Jwt__SecretKey="sua-chave-secreta-segura-com-minimo-32-caracteres"
export Jwt__Issuer="VixClinic"
export Jwt__Audience="VixClinicAPI"
export Jwt__ExpiryMinutes="60"
```

## 🐳 Docker (Opcional)

```bash
# Build
docker build -t vixclinic-api .

# Run
docker run -p 5000:80 -e ConnectionStrings__DefaultConnection="..." vixclinic-api
```

## 📝 Comandos Úteis

```bash
# Criar nova migração
dotnet ef migrations add NomeDaMigracao --project VixClinic.Infrastructure --startup-project VixClinic.API

# Aplicar migrações
dotnet ef database update --project VixClinic.Infrastructure --startup-project VixClinic.API

# Reverter migração
dotnet ef database update NomeMigracaoAnterior --project VixClinic.Infrastructure --startup-project VixClinic.API

# Gerar script SQL
dotnet ef migrations script --project VixClinic.Infrastructure --startup-project VixClinic.API --output migration.sql
```

## 🔒 Segurança

- Senhas hasheadas com **BCrypt** (10 rounds)
- Autenticação via **JWT tokens**
- CORS configurado para o frontend
- HTTPS obrigatório em produção
- SQL Injection prevenido pelo EF Core (parametrização)

## 📊 Endpoints Principais

- `POST /api/auth/login` - Login
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/vacinas` - Listar vacinas
- `POST /api/agendamentos` - Criar agendamento
- `POST /api/aplicacoes` - Registrar aplicação de vacina
- `GET /api/dashboard/stats` - Estatísticas gerais

Consulte `/docs/API_ENDPOINTS.md` para lista completa.

## 🐛 Troubleshooting

### Erro de conexão com PostgreSQL

```
Npgsql.NpgsqlException: Failed to connect to localhost:5432
```

**Solução**: Verifique se o PostgreSQL está rodando e as credenciais estão corretas.

### Erro de migração

```
Unable to create an object of type 'VixClinicContext'
```

**Solução**: Configure a connection string em `appsettings.json`.

## 📄 Licença

Este projeto é proprietário da Felpidex Sistemas.

## 👥 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Commit: `git commit -m 'Add nova feature'`
3. Push: `git push origin feature/nova-feature`
4. Abra um Pull Request

## 📞 Suporte

- **Documentação**: `/docs`
- **Issues**: [GitHub Issues](https://github.com/Felpidex-Sys/vaxclinic/issues)

---

**Versão**: 1.0.0  
**Última atualização**: 2025-10-17
