# 🏗️ Arquitetura do Backend - VixClinic

## 📋 Visão Geral do Sistema

**VixClinic** é um sistema de gerenciamento de clínica de vacinação desenvolvido com:
- **Frontend**: React 18.3 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Estilo**: Tailwind CSS + shadcn/ui
- **Validação**: Zod schemas
- **State Management**: React Hooks + TanStack Query
- **Autenticação**: Supabase Auth + JWT

## 🔐 Fluxo de Autenticação

### Arquitetura de Autenticação

```
┌─────────────────┐
│   Login Form    │
│  (email/senha)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Supabase Auth                     │
│   - Valida credenciais              │
│   - Gera JWT token                  │
│   - Retorna Session + User          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   useAuth Hook                      │
│   - Armazena session/user no state  │
│   - Setup onAuthStateChange         │
│   - Auto-refresh de tokens          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Fetch User Profile                │
│   SELECT * FROM funcionario         │
│   WHERE email = user.email          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   AuthContext                       │
│   - user: User | null               │
│   - session: Session | null         │
│   - isLoading: boolean              │
└─────────────────────────────────────┘
```

### Detalhes de Implementação

**Arquivo**: `src/hooks/useAuth.ts`

```typescript
// Estado de autenticação
const [user, setUser] = useState<User | null>(null);
const [session, setSession] = useState<Session | null>(null);
const [isLoading, setIsLoading] = useState(true);

// Setup do listener de mudanças de auth
useEffect(() => {
  // 1. Setup listener PRIMEIRO
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch profile do funcionário
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.email);
        }, 0);
      }
    }
  );

  // 2. Depois check session existente
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);
```

**Tabela funcionario** armazena:
- Credenciais (email, senha hash com bcrypt)
- Dados pessoais (nome, CPF, telefone)
- Cargo e status
- Data de admissão

### Senha Hash

**Arquivo**: `src/lib/crypto.ts`

```typescript
// Hash com bcrypt (10 rounds)
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verificação
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

## 📁 Estrutura de Código

### Frontend Structure

```
src/
├── components/
│   ├── forms/                    # Formulários de entidades
│   │   ├── AgendamentoForm.tsx   # Criar/editar agendamento
│   │   ├── BatchForm.tsx         # Criar/editar lote (com preços)
│   │   ├── ClientForm.tsx        # Criar/editar cliente
│   │   ├── EmployeeForm.tsx      # Criar/editar funcionário
│   │   ├── VaccineApplicationForm.tsx  # Registrar aplicação
│   │   ├── VaccineForm.tsx       # Criar/editar vacina
│   │   └── BatchManagementDialog.tsx   # Gestão de lotes
│   ├── ui/                       # Componentes shadcn/ui
│   ├── AppSidebar.tsx            # Menu lateral
│   ├── AuthProvider.tsx          # Context de autenticação
│   ├── Dashboard.tsx             # Dashboard principal
│   ├── Layout.tsx                # Layout base
│   └── Login.tsx                 # Tela de login
├── pages/
│   ├── Agendamentos.tsx          # Página de agendamentos
│   ├── Auth.tsx                  # Página de autenticação
│   ├── Clientes.tsx              # Página de clientes
│   ├── Funcionarios.tsx          # Página de funcionários
│   ├── Index.tsx                 # Dashboard
│   ├── Relatorios.tsx            # Relatórios
│   └── Vacinas.tsx               # Vacinas e lotes
├── hooks/
│   ├── useAuth.ts                # Hook de autenticação
│   ├── useLocalStorage.ts        # Persistência local
│   └── use-mobile.tsx            # Detecção mobile
├── lib/
│   ├── crypto.ts                 # Hash de senhas (bcrypt)
│   ├── validations.ts            # Schemas Zod + formatadores
│   └── utils.ts                  # Utilitários gerais
├── types/
│   └── index.ts                  # Tipos TypeScript
└── integrations/
    └── supabase/
        ├── client.ts             # Cliente Supabase (AUTO-GERADO)
        └── types.ts              # Tipos do banco (AUTO-GERADO)
```

### Backend Structure (Supabase)

```
supabase/
├── migrations/                   # Migrações SQL
│   └── [timestamp]_*.sql         # Arquivos de migração
└── config.toml                   # Configuração Supabase
```

## 🔄 Padrões de Código

### 1. Operações CRUD

Todas as páginas seguem o mesmo padrão:

```typescript
// Estado
const [items, setItems] = useState<Item[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
const [showForm, setShowForm] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);

// Fetch inicial
useEffect(() => {
  fetchItems();
}, []);

// Fetch function
const fetchItems = async () => {
  setIsLoading(true);
  const { data, error } = await supabase
    .from('tabela')
    .select('*')
    .order('campo', { ascending: true });
  
  if (error) {
    toast.error('Erro ao carregar dados');
  } else {
    setItems(data);
  }
  setIsLoading(false);
};

// Save (INSERT ou UPDATE)
const handleSave = async (item: Item) => {
  if (editingItem) {
    // UPDATE
    const { error } = await supabase
      .from('tabela')
      .update(item)
      .eq('id', editingItem.id);
  } else {
    // INSERT
    const { error } = await supabase
      .from('tabela')
      .insert([item]);
  }
  
  if (!error) {
    fetchItems();
    setShowForm(false);
    toast.success('Salvo com sucesso');
  }
};

// Delete
const handleDelete = async (id: string) => {
  if (confirm('Confirma exclusão?')) {
    const { error } = await supabase
      .from('tabela')
      .delete()
      .eq('id', id);
    
    if (!error) {
      fetchItems();
      toast.success('Excluído com sucesso');
    }
  }
};
```

### 2. Validação com Zod

**Arquivo**: `src/lib/validations.ts`

```typescript
// Schema exemplo (Cliente)
export const clienteSchema = z.object({
  CPF: cpfSchema,                    // 11 dígitos numéricos
  nomeCompleto: z.string().min(3),   // Mínimo 3 caracteres
  dataNasc: z.string().optional(),   // Data opcional
  email: emailSchema.optional(),     // Email opcional
  telefone: telefoneSchema,          // 10-11 dígitos numéricos
  alergias: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO'])
});

// Uso no componente
const form = useForm<z.infer<typeof clienteSchema>>({
  resolver: zodResolver(clienteSchema),
  defaultValues: { ... }
});
```

### 3. Formatação de Dados

**Arquivo**: `src/lib/validations.ts`

```typescript
// CPF: armazena sem formatação, exibe com formatação
formatCPF("12345678901")        // Remove não-numéricos → "12345678901"
displayCPF("12345678901")       // Exibe → "123.456.789-01"

// Telefone: armazena sem formatação, exibe com formatação
formatTelefone("11987654321")   // Remove não-numéricos → "11987654321"
displayTelefone("11987654321")  // Exibe → "(11) 98765-4321"
```

## 🗺️ Mapeamento de Operações CRUD

### 📊 CLIENTES (`src/pages/Clientes.tsx`)

| Operação | Método Supabase | Tabela | Validação | Trigger |
|----------|----------------|--------|-----------|---------|
| Listar | `.from('cliente').select('*')` | `cliente` | - | - |
| Buscar por CPF | `.from('cliente').select('*').eq('cpf', cpf)` | `cliente` | - | - |
| Criar | `.from('cliente').insert([cliente])` | `cliente` | `clienteSchema` | `valida_cliente()` |
| Atualizar | `.from('cliente').update(cliente).eq('cpf', cpf)` | `cliente` | `clienteSchema` | `valida_cliente()` |
| Deletar | `.from('cliente').delete().eq('cpf', cpf)` | `cliente` | - | `log_aplicacoes_antes_deletar_cliente()` |
| Estatísticas | Calculado no frontend | `cliente` | - | - |

### 👥 FUNCIONÁRIOS (`src/pages/Funcionarios.tsx`)

| Operação | Método Supabase | Tabela | Validação | Trigger |
|----------|----------------|--------|-----------|---------|
| Listar | `.from('funcionario').select('*')` | `funcionario` | - | - |
| Criar | `.from('funcionario').insert([funcionario])` | `funcionario` | `funcionarioSchema` | `valida_funcionario()` |
| Atualizar | `.from('funcionario').update(func).eq('idfuncionario', id)` | `funcionario` | `funcionarioSchema` | `valida_funcionario()` |
| Login | `supabase.auth.signInWithPassword({email, password})` | `funcionario` | Email/senha | - |

**Nota**: Senha é hasheada com bcrypt antes de salvar

### 💉 VACINAS (`src/pages/Vacinas.tsx`)

| Operação | Método Supabase | Tabela | Validação | Trigger |
|----------|----------------|--------|-----------|---------|
| Listar vacinas | `.from('vacina').select('*')` | `vacina` | - | - |
| Criar vacina | `.from('vacina').insert([vacina])` | `vacina` | `vacinaSchema` | - |
| Atualizar vacina | `.from('vacina').update(vacina).eq('idvacina', id)` | `vacina` | `vacinaSchema` | - |
| Deletar vacina | `.from('vacina').delete().eq('idvacina', id)` | `vacina` | - | - |
| Listar lotes | `.from('lote').select('*, vacina(*)')` | `lote` + `vacina` | - | - |
| Criar lote | `.from('lote').insert([lote])` | `lote` | `loteSchema` | `valida_lote()` |
| Atualizar lote | `.from('lote').update(lote).eq('numlote', num)` | `lote` | `loteSchema` | `valida_lote()` |
| Deletar lote | `.from('lote').delete().eq('numlote', num)` | `lote` | - | - |
| Estatísticas | JOIN com `agendamento` | `vacina` + `agendamento` | - | - |

**Regra especial**: `precocompra` é imutável após criação (disabled no form ao editar)

### 📅 AGENDAMENTOS (`src/pages/Agendamentos.tsx`)

| Operação | Método Supabase | Tabela | Validação | Trigger |
|----------|----------------|--------|-----------|---------|
| Listar | `.from('agendamento').select('*, cliente(*), lote(*, vacina(*))')` | `agendamento` + JOINs | - | - |
| Criar | `.from('agendamento').insert([agendamento])` | `agendamento` | `agendamentoSchema` | `valida_agendamento()`, `reserva_estoque_ao_agendar()` |
| Atualizar | `.from('agendamento').update(agend).eq('idagendamento', id)` | `agendamento` | `agendamentoSchema` | - |
| Deletar | `.from('agendamento').delete().eq('idagendamento', id)` | `agendamento` | - | `retorna_estoque_ao_cancelar()` |

**Regra especial**: `funcionario_idfuncionario` é NULLABLE (não obrigatório ao criar, apenas ao realizar)

### 💊 APLICAÇÕES (Registros de vacinação)

| Operação | Método Supabase | Tabela | Validação | Trigger |
|----------|----------------|--------|-----------|---------|
| Listar | `.from('aplicacao').select('*, cliente(*), funcionario(*), agendamento(*)')` | `aplicacao` + JOINs | - | - |
| Criar | `.from('aplicacao').insert([aplicacao])` | `aplicacao` | `aplicacaoSchema` | `valida_aplicacao()`, `finaliza_agendamento_apos_aplicacao()` |

**Regra especial**: Ao criar aplicação, o agendamento é marcado como REALIZADO e deletado automaticamente

### 📊 DASHBOARD (`src/components/Dashboard.tsx`)

| Métrica | Query | Descrição |
|---------|-------|-----------|
| Total Clientes | `COUNT(*)` de `cliente` | Todos os clientes |
| Total Funcionários | `COUNT(*)` de `funcionario` | Todos os funcionários |
| Total Vacinas | `COUNT(*)` de `vacina` | Todas as vacinas |
| Vacinações Hoje | `COUNT(*)` de `aplicacao` WHERE `dataAplicacao = hoje` | Aplicações de hoje |
| Agendamentos Hoje | `COUNT(*)` de `agendamento` WHERE `dataAgendada = hoje` | Agendamentos de hoje |
| Lotes Vencendo | `SELECT * FROM lote WHERE dataValidade <= hoje + 30 dias` | Lotes com validade próxima |
| Aplicações Recentes | `SELECT * FROM aplicacao ORDER BY dataAplicacao DESC LIMIT 10` | Últimas 10 aplicações |
| Agendamentos Próximos | `SELECT * FROM agendamento ORDER BY dataAgendada ASC LIMIT 10` | Próximos 10 agendamentos |

## 🔗 Diagrama de Relacionamentos entre Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                              │
│                    (Router principal)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Auth.tsx   │  │ Layout.tsx  │  │ Index.tsx   │
│  (Login)    │  │ (Sidebar +  │  │ (Dashboard) │
└─────────────┘  │  Content)   │  └─────────────┘
                 └──────┬──────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Clientes.tsx │ │Funcionarios  │ │ Vacinas.tsx  │
│              │ │   .tsx       │ │              │
│ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │
│ │ClientForm│ │ │ │Employee  │ │ │ │Vaccine   │ │
│ │          │ │ │ │Form      │ │ │ │Form      │ │
│ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │
└──────────────┘ └──────────────┘ │ ┌──────────┐ │
                                  │ │BatchForm │ │
┌──────────────┐                  │ └──────────┘ │
│Agendamentos  │                  └──────────────┘
│   .tsx       │
│ ┌──────────┐ │
│ │Agendamen │ │
│ │toForm    │ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │Vaccine   │ │
│ │Applicat. │ │
│ │Form      │ │
│ └──────────┘ │
└──────────────┘
```

## 🔐 Row Level Security (RLS)

### Políticas Atuais

Todas as tabelas têm RLS habilitado com políticas **permissivas** (`true`):

```sql
-- Exemplo: tabela cliente
CREATE POLICY "Funcionarios podem gerenciar clientes"
ON public.cliente
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### ⚠️ CRÍTICO: Políticas Precisam Ser Melhoradas

As políticas atuais são **muito permissivas** para produção. Para C#, você deve implementar:

1. **Políticas baseadas em roles**:
```sql
-- Criar enum de roles
CREATE TYPE app_role AS ENUM ('admin', 'vacinador', 'atendente');

-- Criar tabela de roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    UNIQUE(user_id, role)
);

-- Função de verificação de role
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Política exemplo
CREATE POLICY "Apenas admins podem deletar clientes"
ON public.cliente
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
```

2. **Políticas por operação**:
- `SELECT`: Todos os funcionários autenticados
- `INSERT`: Funcionários com role 'atendente' ou 'admin'
- `UPDATE`: Funcionários com role 'atendente' ou 'admin'
- `DELETE`: Apenas 'admin'

3. **Políticas de privacidade**:
- Funcionários só podem ver seus próprios dados sensíveis
- Histórico de aplicações só visível para admins

## 📦 Dependências Principais

### Frontend
```json
{
  "@supabase/supabase-js": "^2.74.0",
  "@tanstack/react-query": "^5.83.0",
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0",
  "zod": "^3.25.76",
  "bcryptjs": "^3.0.2",
  "date-fns": "^3.6.0",
  "lucide-react": "^0.462.0",
  "sonner": "^1.7.4"
}
```

### Supabase Backend
- PostgreSQL 15
- PostgREST (API REST automática)
- GoTrue (Autenticação)
- Realtime (WebSockets - não usado atualmente)

## 🚀 Fluxos Principais

### Fluxo Completo: Cliente → Agendamento → Aplicação

```
1. CADASTRO DE CLIENTE
   └─> INSERT INTO cliente
       └─> TRIGGER: valida_cliente() (valida data de nascimento)

2. CADASTRO DE VACINA
   └─> INSERT INTO vacina
   
3. CADASTRO DE LOTE
   └─> INSERT INTO lote (precocompra, precovenda, quantidadeInicial)
       └─> TRIGGER: valida_lote() (valida data de validade)

4. AGENDAMENTO
   └─> INSERT INTO agendamento
       └─> TRIGGER: valida_agendamento() (valida data futura)
       └─> TRIGGER: reserva_estoque_ao_agendar() (quantidadeDisponivel--)

5. APLICAÇÃO DA VACINA
   └─> INSERT INTO aplicacao
       └─> TRIGGER: valida_aplicacao() (valida data passada)
       └─> TRIGGER: finaliza_agendamento_apos_aplicacao()
           └─> UPDATE agendamento SET status = 'REALIZADO'
           └─> DELETE FROM agendamento

6. HISTÓRICO (ao deletar cliente)
   └─> DELETE FROM cliente
       └─> TRIGGER: log_aplicacoes_antes_deletar_cliente()
           └─> INSERT INTO historico_aplicacoes_cliente
```

---

## 📝 Observações Importantes

1. **Auto-gerados**: `client.ts` e `types.ts` em `src/integrations/supabase/` são gerados automaticamente pelo Supabase e **NÃO DEVEM SER EDITADOS**

2. **Migrations**: Todas as alterações no banco devem ser feitas via migrations SQL em `supabase/migrations/`

3. **Validação dupla**: Validação acontece tanto no frontend (Zod) quanto no backend (Triggers SQL)

4. **Toast notifications**: Todas as operações CRUD exibem feedback via `sonner` toast

5. **Loading states**: Todas as páginas implementam loading states para melhor UX

6. **Error handling**: Erros do Supabase são capturados e exibidos com mensagens amigáveis

7. **Formatação**: CPF e telefone são armazenados sem formatação (apenas números) mas exibidos formatados

8. **Preços**: Lote tem dois preços - `precocompra` (imutável após criação) e `precovenda` (editável)

---

**Documento gerado em**: 2025-10-14  
**Versão do Sistema**: 1.0.0  
**Autor**: VixClinic Documentation Team
