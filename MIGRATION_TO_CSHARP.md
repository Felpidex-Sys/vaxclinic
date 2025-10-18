# Guia de Migração - Supabase → C# Backend

## 🎯 Situação Atual

Você tem **2 backends rodando em paralelo**:

1. **Backend Original**: TypeScript + Supabase (ativo no frontend)
2. **Backend Novo**: C# + ASP.NET Core (implementado mas não conectado)

## 📋 Opções de Migração

### Opção 1: 🐢 Migração Gradual (Recomendado para Produção)

**Vantagens:**
- ✅ Zero downtime
- ✅ Testar C# antes de desligar Supabase
- ✅ Rollback fácil

**Como fazer:**
1. Mantenha Supabase rodando
2. Execute C# backend em paralelo (`dotnet run`)
3. Teste endpoints C# com Postman/Insomnia
4. Migre frontend página por página
5. Quando tudo funcionar, desligue Supabase

**Exemplo:**
```typescript
// src/lib/api.ts (novo arquivo)
const API_URL = import.meta.env.VITE_USE_CSHARP === 'true' 
  ? 'http://localhost:5000/api'
  : import.meta.env.VITE_SUPABASE_URL;

// Migre um endpoint por vez
export const getClientes = async () => {
  if (import.meta.env.VITE_USE_CSHARP === 'true') {
    // Nova API C#
    return fetch(`${API_URL}/clientes`);
  } else {
    // API Supabase antiga
    return supabase.from('cliente').select('*');
  }
};
```

---

### Opção 2: 🚀 Migração Completa (Recomendado para Desenvolvimento)

**Vantagens:**
- ✅ Código limpo
- ✅ Uma stack só
- ✅ Mais fácil de manter

**Como fazer:**

#### Passo 1: Exportar dados do Supabase
```bash
# No Supabase Dashboard → Database → Export
# Baixar SQL dump
```

#### Passo 2: Configurar PostgreSQL Local
```bash
# Instalar PostgreSQL 15+
# Criar banco
psql -U postgres
CREATE DATABASE vixclinic;
\q
```

#### Passo 3: Importar dados Supabase → PostgreSQL Local
```bash
psql -U postgres -d vixclinic < supabase_dump.sql
```

#### Passo 4: Criar Migrations C#
```bash
cd backend/VixClinic.Infrastructure

# Criar migration a partir do banco existente
dotnet ef migrations add InitialCreate --startup-project ../VixClinic.API

# Ou scaffold do banco existente
dotnet ef dbcontext scaffold "Host=localhost;Port=5432;Database=vixclinic;Username=postgres;Password=postgres" Npgsql.EntityFrameworkCore.PostgreSQL --startup-project ../VixClinic.API --force
```

#### Passo 5: Atualizar Frontend
```bash
# Instalar axios (ou continuar com fetch)
npm install axios
```

```typescript
// src/lib/api.ts (NOVO)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adicionar token JWT automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

```typescript
// src/hooks/useClientes.ts (ATUALIZADO)
import api from '@/lib/api';

export const useClientes = () => {
  const getClientes = async () => {
    const response = await api.get('/clientes');
    return response.data;
  };

  const createCliente = async (data: ClienteDto) => {
    const response = await api.post('/clientes', data);
    return response.data;
  };

  // ... outros métodos
};
```

#### Passo 6: Atualizar Autenticação
```typescript
// src/hooks/useAuth.ts (ATUALIZADO)
import api from '@/lib/api';

export const useAuth = () => {
  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ... outros métodos
};
```

#### Passo 7: Remover Supabase
```bash
# Desinstalar Supabase
npm uninstall @supabase/supabase-js

# Deletar pasta
rm -rf src/integrations/supabase/

# Deletar migrations antigas
rm -rf supabase/
```

#### Passo 8: Atualizar .env
```env
# .env (ANTES - Supabase)
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=...

# .env (DEPOIS - C#)
VITE_API_URL=http://localhost:5000/api
```

---

### Opção 3: 🔄 Manter Ambos (Não Recomendado)

**Quando usar:**
- Supabase para funcionalidades específicas (Auth, Storage)
- C# para lógica de negócio pesada

**Estrutura:**
```typescript
// Frontend decide qual backend usar por feature
const authService = supabaseAuth; // Auth continua Supabase
const dataService = csharpApi;    // CRUD vai para C#
```

---

## 🛠️ Script de Migração Automática

Criei um script para facilitar a migração:

```typescript
// scripts/migrate-to-csharp.ts
import fs from 'fs';
import path from 'path';

const supabaseFiles = [
  'src/integrations/supabase',
  'supabase'
];

const backupFolder = 'backup-supabase';

// Backup antes de remover
supabaseFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const backupPath = path.join(backupFolder, file);
    fs.cpSync(file, backupPath, { recursive: true });
    console.log(`✅ Backup criado: ${backupPath}`);
  }
});

// Criar adapter de API
const apiAdapterTemplate = `
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;
`;

fs.writeFileSync('src/lib/api.ts', apiAdapterTemplate);
console.log('✅ API adapter criado');
```

---

## 📊 Comparação Backend Supabase vs C#

| Feature | Supabase | C# ASP.NET Core |
|---------|----------|-----------------|
| **Hospedagem** | Cloud (gerenciado) | Self-hosted |
| **Custo** | $25/mês (após free tier) | Servidor próprio |
| **Controle** | Limitado | Total |
| **Performance** | Boa | Excelente |
| **Escalabilidade** | Automática | Manual |
| **Customização** | Limitada | Ilimitada |
| **Auth Built-in** | ✅ Sim | ⚠️ JWT manual |
| **Storage** | ✅ Integrado | ❌ Precisa adicionar |
| **Realtime** | ✅ Sim | ⚠️ SignalR manual |
| **Migrations** | SQL | EF Core |
| **Triggers** | PostgreSQL | C# + PostgreSQL |

---

## 🎯 Minha Recomendação

Para o seu caso (**VaxClinic - Sistema Interno**):

### ✅ **Migre completamente para C#** porque:

1. **Controle Total**: Você tem todas as regras de negócio no código
2. **Custo Zero**: Sem mensalidade Supabase
3. **Performance**: Backend local é mais rápido
4. **Aprendizado**: Stack C# completo no currículo
5. **Manutenção**: Código único, mais fácil de debugar

### 📝 **Checklist de Migração (1 dia de trabalho):**

- [ ] Instalar PostgreSQL 15+
- [ ] Exportar dados do Supabase
- [ ] Criar banco local e importar
- [ ] Criar migrations EF Core
- [ ] Testar backend C# (Swagger)
- [ ] Criar seed data (funcionário admin)
- [ ] Atualizar frontend (axios + api.ts)
- [ ] Remover código Supabase
- [ ] Testar integração completa
- [ ] Commit e push

---

## 🚨 Importante

**ANTES de deletar Supabase:**
1. ✅ Faça backup dos dados
2. ✅ Teste TODOS os endpoints C#
3. ✅ Verifique autenticação funcionando
4. ✅ Confirme que frontend conecta ao C#

---

## 📞 Suporte

Se precisar de ajuda na migração, me avise em qual etapa está!
