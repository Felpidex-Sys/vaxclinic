# 💉 VaxClinic - Sistema de Gestão de Vacinação

Sistema completo para gerenciamento de clínicas de vacinação com controle de estoque, agendamentos, aplicações e relatórios.

## 🚀 Stack Tecnológica

### Frontend
- **React 18.3** + **TypeScript**
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Shadcn/ui** - Componentes UI
- **Tailwind CSS** - Estilização
- **Axios** - Cliente HTTP

### Backend
- **ASP.NET Core 9** - Web API
- **Entity Framework Core 9** - ORM
- **PostgreSQL 15+** - Banco de dados
- **JWT Authentication** - Autenticação
- **BCrypt** - Hash de senhas
- **FluentValidation** - Validação
- **AutoMapper** - Mapeamento de objetos
- **Serilog** - Logging

## 📋 Funcionalidades

- ✅ **Gestão de Clientes** - CRUD completo com histórico de vacinação
- ✅ **Gestão de Funcionários** - Controle de acesso e permissões
- ✅ **Gestão de Vacinas** - Cadastro de vacinas com doses e intervalos
- ✅ **Gestão de Lotes** - Controle de estoque e validade
- ✅ **Agendamentos** - Sistema de agendamento de vacinação
- ✅ **Aplicações** - Registro de vacinas aplicadas
- ✅ **Dashboard** - Estatísticas e indicadores
- ✅ **Relatórios** - Lotes vencendo, aplicações recentes, etc.
- ✅ **Autenticação JWT** - Login seguro com tokens
- ✅ **Validações** - CPF, e-mail, telefone, datas

## 🗄️ Configurar Banco de Dados

**👉 Leia o guia completo:** [DATABASE_SETUP.md](DATABASE_SETUP.md)

### Guia Rápido (5 minutos):

```bash
# 1. Instalar PostgreSQL 15+
# Download: https://www.postgresql.org/download/

# 2. Criar banco
psql -U postgres
CREATE DATABASE vixclinic;
\q

# 3. Configurar connection string
# Editar: backend/VixClinic.API/appsettings.json
# "DefaultConnection": "Host=localhost;Port=5432;Database=vixclinic;Username=postgres;Password=SUA_SENHA"

# 4. Instalar EF Core tools
dotnet tool install --global dotnet-ef

# 5. Criar e aplicar migrations
cd backend/VixClinic.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../VixClinic.API
dotnet ef database update --startup-project ../VixClinic.API

# 6. Pronto! ✅
```

## 🏃 Como Executar

### Backend (Terminal 1)
```bash
cd backend/VixClinic.API
dotnet run
```

**API disponível em:**
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger: `https://localhost:5001/swagger`

### Frontend (Terminal 2)
```bash
npm install      # Primeira vez
npm run dev
```

**App disponível em:** `http://localhost:5173`

## 🔐 Login Padrão

Após configurar o banco, criar usuário admin:

```sql
INSERT INTO funcionario (nomecompleto, cpf, email, senha, cargo, status) 
VALUES (
  'Administrador',
  '00000000000',
  'admin@vixclinic.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Administrador',
  'ATIVO'
);
```

**Credenciais:**
- Email: `admin@vixclinic.com`
- Senha: `admin123`

## 📁 Estrutura do Projeto

```
vaxclinic/
├── backend/                    # Backend C# ASP.NET Core
│   ├── VixClinic.API/         # Controllers, Program.cs
│   ├── VixClinic.Core/        # Entidades, Enums
│   ├── VixClinic.Application/ # DTOs, Validators, Helpers
│   ├── VixClinic.Infrastructure/ # DbContext, Migrations
│   └── VixClinic.Tests/       # Testes unitários
│
├── src/                        # Frontend React
│   ├── components/            # Componentes React
│   ├── pages/                 # Páginas
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilitários, API client
│   └── types/                 # TypeScript types
│
├── docs/                       # Documentação
├── public/                     # Assets estáticos
└── DATABASE_SETUP.md          # 👈 Guia completo do banco
```

## 📚 Documentação

- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Como configurar PostgreSQL
- **[backend/README.md](backend/README.md)** - Documentação do backend
- **[backend/IMPLEMENTATION_SUMMARY.md](backend/IMPLEMENTATION_SUMMARY.md)** - Resumo da implementação
- **[docs/](docs/)** - Documentação técnica detalhada

## 🔧 Tecnologias e Bibliotecas

### Backend
- ASP.NET Core 9
- Entity Framework Core 9
- Npgsql.EntityFrameworkCore.PostgreSQL
- Microsoft.AspNetCore.Authentication.JwtBearer
- FluentValidation
- AutoMapper
- BCrypt.Net-Next
- Serilog
- Swashbuckle (Swagger)

### Frontend
- React 18.3
- TypeScript
- Vite
- TanStack Query
- Axios
- Shadcn/ui
- Tailwind CSS
- Lucide React (ícones)

## 🐛 Troubleshooting

Problemas comuns? Veja [DATABASE_SETUP.md](DATABASE_SETUP.md) seção "Troubleshooting".

## 📝 Licença

Este projeto é privado e proprietário.

---

**Desenvolvido com ❤️ usando .NET 9 e React**
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/02acf059-0fbd-4674-97bb-652ab12db217) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
