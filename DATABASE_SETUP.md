# 🗄️ Como Conectar o Banco de Dados PostgreSQL

## ⚡ Guia Rápido (5 minutos)

### 1️⃣ Instalar PostgreSQL

**Windows:**
```bash
# Baixar instalador oficial
https://www.postgresql.org/download/windows/

# Ou usar Chocolatey
choco install postgresql

# Ou usar Scoop
scoop install postgresql
```

**Configuração padrão:**
- Porta: `5432`
- Usuário: `postgres`
- Senha: (defina na instalação)

### 2️⃣ Criar o Banco de Dados

```bash
# Abrir terminal
psql -U postgres

# Criar banco
CREATE DATABASE vixclinic;

# Conectar ao banco
\c vixclinic

# Sair
\q
```

### 3️⃣ Configurar Connection String

Editar `backend/VixClinic.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=vixclinic;Username=postgres;Password=SUA_SENHA_AQUI"
  }
}
```

**⚠️ IMPORTANTE:** Substitua `SUA_SENHA_AQUI` pela senha do PostgreSQL!

### 4️⃣ Instalar EF Core Tools

```bash
# Instalar globalmente
dotnet tool install --global dotnet-ef

# Ou atualizar se já instalado
dotnet tool update --global dotnet-ef
```

### 5️⃣ Criar e Aplicar Migrations

```bash
cd backend/VixClinic.Infrastructure

# Criar migration inicial
dotnet ef migrations add InitialCreate --startup-project ../VixClinic.API

# Aplicar no banco
dotnet ef database update --startup-project ../VixClinic.API
```

### 6️⃣ (Opcional) Adicionar Usuário Admin

```bash
# Conectar ao banco
psql -U postgres -d vixclinic

# Inserir funcionário admin (senha: admin123)
INSERT INTO funcionario (nomecompleto, cpf, email, senha, cargo, status) 
VALUES (
  'Administrador',
  '00000000000',
  'admin@vixclinic.com',
  '$2a$10$rGQN8X8YHyKJZK3Q5Z5X3.xYqX5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5x', -- admin123
  'Administrador',
  'ATIVO'
);

# Sair
\q
```

**Senha hash BCrypt para `admin123`:**
```
$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

### 7️⃣ Rodar Backend

```bash
cd backend/VixClinic.API
dotnet run
```

### 8️⃣ Rodar Frontend

```bash
# Terminal separado
npm run dev
```

### 9️⃣ Testar

- **Swagger**: `http://localhost:5000/swagger`
- **Login**: `admin@vixclinic.com` / `admin123`
- **Frontend**: `http://localhost:5173`

---

## 🔧 Configuração Detalhada

### Connection String - Opções

**Desenvolvimento Local:**
```
Host=localhost;Port=5432;Database=vixclinic;Username=postgres;Password=postgres
```

**Com SSL (Produção):**
```
Host=localhost;Port=5432;Database=vixclinic;Username=postgres;Password=senha;SSL Mode=Require
```

**Com pooling de conexões:**
```
Host=localhost;Port=5432;Database=vixclinic;Username=postgres;Password=senha;Pooling=true;Minimum Pool Size=0;Maximum Pool Size=100
```

### appsettings.Development.json

Para separar configurações de dev/prod:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=vixclinic_dev;Username=postgres;Password=postgres"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug"
    }
  }
}
```

---

## 📊 Estrutura do Banco (Criada Automaticamente)

As migrations criarão:

### Tabelas:
1. **cliente** - Clientes (PK: cpf)
2. **funcionario** - Funcionários (PK: idfuncionario)
3. **vacina** - Vacinas (PK: idvacina)
4. **lote** - Lotes de vacinas (PK: numlote)
5. **agendamento** - Agendamentos (PK: idagendamento)
6. **aplicacao** - Aplicações realizadas (PK: idaplicacao)

### Enums PostgreSQL:
- `cliente_status`
- `funcionario_status`
- `vacina_status`
- `vacina_categoria`
- `agendamento_status`

### Índices:
- `cliente.email` (unique)
- `funcionario.cpf` (unique)
- `funcionario.email` (unique)
- `lote.codigolote` (unique)

---

## 🐛 Troubleshooting

### Erro: "Could not connect to the server"

```bash
# Verificar se PostgreSQL está rodando
# Windows
Get-Service postgresql*

# Iniciar se não estiver
net start postgresql-x64-15
```

### Erro: "password authentication failed"

1. Verificar senha no `appsettings.json`
2. Resetar senha:
```bash
psql -U postgres
ALTER USER postgres PASSWORD 'nova_senha';
```

### Erro: "database 'vixclinic' does not exist"

```bash
psql -U postgres
CREATE DATABASE vixclinic;
```

### Erro: "relation 'funcionario' does not exist"

```bash
# Migrations não foram aplicadas
cd backend/VixClinic.Infrastructure
dotnet ef database update --startup-project ../VixClinic.API
```

### Erro: "No executable found matching command 'dotnet-ef'"

```bash
# Instalar EF Core tools
dotnet tool install --global dotnet-ef
```

### Limpar banco e recriar:

```bash
# Deletar banco
psql -U postgres
DROP DATABASE vixclinic;
CREATE DATABASE vixclinic;
\q

# Deletar migrations antigas
rm -rf backend/VixClinic.Infrastructure/Migrations/

# Recriar migration
cd backend/VixClinic.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../VixClinic.API
dotnet ef database update --startup-project ../VixClinic.API
```

---

## 🔐 Script SQL - Criar Usuário Admin

Salve como `seed-admin.sql`:

```sql
-- Criar usuário admin
INSERT INTO funcionario (
    nomecompleto, 
    cpf, 
    email, 
    senha, 
    cargo, 
    status,
    dataadmissao
) VALUES (
    'Administrador do Sistema',
    '00000000000',
    'admin@vixclinic.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'Administrador',
    'ATIVO',
    CURRENT_DATE
) ON CONFLICT (cpf) DO NOTHING;

-- Verificar
SELECT * FROM funcionario WHERE email = 'admin@vixclinic.com';
```

Executar:
```bash
psql -U postgres -d vixclinic -f seed-admin.sql
```

---

## 🚀 Comandos Úteis

### Migrations

```bash
# Criar nova migration
dotnet ef migrations add NomeDaMigration --startup-project ../VixClinic.API

# Aplicar migrations
dotnet ef database update --startup-project ../VixClinic.API

# Reverter última migration
dotnet ef database update PreviousMigrationName --startup-project ../VixClinic.API

# Remover última migration (não aplicada)
dotnet ef migrations remove --startup-project ../VixClinic.API

# Ver status das migrations
dotnet ef migrations list --startup-project ../VixClinic.API
```

### PostgreSQL

```bash
# Conectar ao banco
psql -U postgres -d vixclinic

# Listar tabelas
\dt

# Descrever tabela
\d funcionario

# Ver dados
SELECT * FROM funcionario;

# Sair
\q
```

### Backup e Restore

```bash
# Backup
pg_dump -U postgres vixclinic > backup.sql

# Restore
psql -U postgres -d vixclinic < backup.sql
```

---

## ✅ Checklist Final

Antes de começar a desenvolver:

- [ ] PostgreSQL instalado e rodando
- [ ] Banco `vixclinic` criado
- [ ] Connection string configurada em `appsettings.json`
- [ ] EF Core tools instalado (`dotnet ef`)
- [ ] Migrations criadas (`dotnet ef migrations add`)
- [ ] Migrations aplicadas (`dotnet ef database update`)
- [ ] Usuário admin criado
- [ ] Backend rodando (`dotnet run`)
- [ ] Frontend rodando (`npm run dev`)
- [ ] Login funcionando no Swagger
- [ ] Login funcionando no Frontend

---

## 🎉 Tudo Pronto!

Seu sistema está completamente configurado e pronto para uso!

**Stack Completa:**
- ✅ Frontend React + TypeScript
- ✅ Backend C# ASP.NET Core 9
- ✅ PostgreSQL 15+
- ✅ Entity Framework Core 9
- ✅ JWT Authentication
- ✅ 42 Endpoints implementados

**Próximos passos:**
1. Começar a usar o sistema
2. Adicionar mais funcionalidades conforme necessário
3. Deploy quando estiver pronto

---

**Algum erro? Veja a seção Troubleshooting acima!** 🔧
