# 🗄️ Schema do Banco de Dados - VixClinic

## 📋 Visão Geral

- **SGBD**: PostgreSQL 15
- **Número de Tabelas**: 7
- **Número de Triggers**: 10
- **Número de Funções**: 10
- **Enums**: 5
- **RLS**: Habilitado em todas as tabelas

## 🗂️ Diagrama Entidade-Relacionamento (ER)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      ┌──────────────┐                           │
│                      │  FUNCIONÁRIO │                           │
│                      │──────────────│                           │
│                      │ idFuncionario│◄──┐                       │
│                      │ nomeCompleto │   │                       │
│                      │ CPF          │   │                       │
│                      │ email (UK)   │   │                       │
│                      │ senha (hash) │   │                       │
│                      │ telefone     │   │                       │
│                      │ cargo        │   │                       │
│                      │ dataAdmissao │   │                       │
│                      │ status       │   │                       │
│                      └──────┬───────┘   │                       │
│                             │           │                       │
│                  ┌──────────┼───────────┤                       │
│                  │          │           │                       │
│                  │          │           │ (FK: funcionario)     │
│                  │          │           │                       │
│       ┌──────────▼──┐   ┌──▼───────────┴──┐                    │
│       │  APLICAÇÃO  │   │   AGENDAMENTO   │                    │
│       │─────────────│   │─────────────────│                    │
│       │ idAplicacao │   │ idAgendamento   │                    │
│       │ dataAplicac │   │ dataAgendada    │                    │
│       │ dose        │   │ status (enum)   │◄──┐                │
│       │ reacoesAdv. │   │ observacoes     │   │                │
│       │ observacoes │   │ Cliente_CPF (FK)├───┼────┐           │
│       │ Cliente_CPF │◄──┤ Lote_numLote(FK)├─┐ │    │           │
│       │ (FK)        │   │ Funcionario_id  │ │ │    │           │
│       │ Funcionario │   │ (FK - NULLABLE) │ │ │    │           │
│       │ _id (FK)    │   └─────────────────┘ │ │    │           │
│       │ Agendamento │                       │ │    │           │
│       │ _id (FK)    │                       │ │    │           │
│       └──────┬──────┘                       │ │    │           │
│              │                              │ │    │           │
│              │         ┌────────────────────┘ │    │           │
│              │         │                      │    │           │
│              │         │  ┌───────────────────┘    │           │
│              │         │  │                        │           │
│              │         ▼  ▼                        │           │
│              │     ┌────────────┐                  │           │
│              │     │    LOTE    │                  │           │
│              │     │────────────│                  │           │
│              │     │ numLote(PK)│                  │           │
│              │     │ codigoLote │                  │           │
│              │     │ qtdInicial │                  │           │
│              │     │ qtdDispon. │                  │           │
│              │     │ dataValidad│                  │           │
│              │     │ precoCompra│                  │           │
│              │     │ precoVenda │                  │           │
│              │     │ Vacina_id  ├──┐               │           │
│              │     │ (FK)       │  │               │           │
│              │     └────────────┘  │               │           │
│              │                     │               │           │
│              │                     ▼               │           │
│              │              ┌───────────┐          │           │
│              │              │  VACINA   │          │           │
│              │              │───────────│          │           │
│              │              │ idVacina  │          │           │
│              │              │ nome      │          │           │
│              │              │ fabricante│          │           │
│              │              │ categoria │          │           │
│              │              │ (enum)    │          │           │
│              │              │ qtdDoses  │          │           │
│              │              │ intervalo │          │           │
│              │              │ Doses     │          │           │
│              │              │ descricao │          │           │
│              │              │ status    │          │           │
│              │              └───────────┘          │           │
│              │                                     │           │
│              │                                     ▼           │
│              │                            ┌────────────────┐   │
│              │                            │    CLIENTE     │   │
│              │                            │────────────────│   │
│              └────────────────────────────┤ CPF (PK)       │   │
│                                           │ nomeCompleto   │   │
│                                           │ dataNasc       │   │
│                                           │ email          │   │
│                                           │ telefone       │   │
│                                           │ alergias       │   │
│                                           │ observacoes    │   │
│                                           │ status (enum)  │   │
│                                           └────────┬───────┘   │
│                                                    │           │
│                                                    │ ON DELETE │
│                                                    │           │
│                                                    ▼           │
│                                     ┌──────────────────────┐   │
│                                     │ HISTORICO_APLICACOES │   │
│                                     │ _CLIENTE             │   │
│                                     │──────────────────────│   │
│                                     │ idHistorico          │   │
│                                     │ cliente_CPF_deletado │   │
│                                     │ idAplicacao_hist     │   │
│                                     │ dataAplicacao_hist   │   │
│                                     │ dose_hist            │   │
│                                     │ idAgendamento_hist   │   │
│                                     │ idFuncionario_hist   │   │
│                                     │ data_exclusao_cliente│   │
│                                     └──────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Tabelas Detalhadas

### 1. `cliente` - Tabela de Clientes

**Descrição**: Armazena informações dos clientes/pacientes da clínica.

| Coluna | Tipo | Nullable | Default | Constraints | Descrição |
|--------|------|----------|---------|-------------|-----------|
| `cpf` | VARCHAR(11) | NO | - | PRIMARY KEY | CPF do cliente (apenas números) |
| `nomecompleto` | VARCHAR(255) | NO | - | NOT NULL | Nome completo do cliente |
| `datanasc` | DATE | YES | - | - | Data de nascimento |
| `email` | VARCHAR(255) | YES | - | - | Email do cliente |
| `telefone` | VARCHAR(11) | YES | - | - | Telefone (apenas números, 10-11 dígitos) |
| `alergias` | TEXT | YES | - | - | Alergias conhecidas |
| `observacoes` | TEXT | YES | - | - | Observações gerais |
| `status` | `cliente_status` | NO | 'ATIVO' | ENUM | Status do cliente (ATIVO/INATIVO) |

**Índices**:
```sql
CREATE INDEX idx_cliente_nome ON cliente(nomecompleto);
CREATE INDEX idx_cliente_status ON cliente(status);
```

**Triggers**:
- `valida_cliente()` - BEFORE INSERT/UPDATE - Valida data de nascimento
- `log_aplicacoes_antes_deletar_cliente()` - BEFORE DELETE - Salva histórico de aplicações

**RLS Policy**:
```sql
CREATE POLICY "Funcionarios podem gerenciar clientes"
ON public.cliente
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### 2. `funcionario` - Tabela de Funcionários

**Descrição**: Armazena informações dos funcionários da clínica (usuários do sistema).

| Coluna | Tipo | Nullable | Default | Constraints | Descrição |
|--------|------|----------|---------|-------------|-----------|
| `idfuncionario` | INTEGER | NO | `nextval('funcionario_idfuncionario_seq')` | PRIMARY KEY, AUTO INCREMENT | ID único do funcionário |
| `nomecompleto` | VARCHAR(255) | NO | - | NOT NULL | Nome completo do funcionário |
| `cpf` | VARCHAR(11) | NO | - | NOT NULL, UNIQUE | CPF do funcionário |
| `email` | VARCHAR(255) | NO | - | NOT NULL, UNIQUE | Email (usado para login) |
| `telefone` | VARCHAR(11) | YES | - | - | Telefone |
| `cargo` | VARCHAR(100) | YES | - | - | Cargo do funcionário |
| `senha` | VARCHAR(255) | NO | - | NOT NULL | Senha hasheada (bcrypt) |
| `status` | `funcionario_status` | NO | 'ATIVO' | ENUM | Status (ATIVO/INATIVO) |
| `dataadmissao` | DATE | YES | - | - | Data de admissão |

**Índices**:
```sql
CREATE UNIQUE INDEX idx_funcionario_email ON funcionario(email);
CREATE UNIQUE INDEX idx_funcionario_cpf ON funcionario(cpf);
CREATE INDEX idx_funcionario_status ON funcionario(status);
```

**Triggers**:
- `valida_funcionario()` - BEFORE INSERT/UPDATE - Valida data de admissão

**RLS Policies**:
```sql
CREATE POLICY "Todos podem visualizar funcionarios"
ON public.funcionario
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção de funcionarios"
ON public.funcionario
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Funcionarios podem se auto-editar"
ON public.funcionario
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

**Nota**: Não há política de DELETE (funcionários não podem ser deletados via API).

---

### 3. `vacina` - Tabela de Tipos de Vacinas

**Descrição**: Armazena os tipos de vacinas disponíveis na clínica.

| Coluna | Tipo | Nullable | Default | Constraints | Descrição |
|--------|------|----------|---------|-------------|-----------|
| `idvacina` | INTEGER | NO | `nextval('vacina_idvacina_seq')` | PRIMARY KEY, AUTO INCREMENT | ID único da vacina |
| `nome` | VARCHAR(255) | NO | - | NOT NULL | Nome da vacina |
| `fabricante` | VARCHAR(255) | YES | - | - | Fabricante |
| `categoria` | `vacina_categoria` | YES | - | ENUM | Categoria (VIRAL/BACTERIANA/OUTRA) |
| `quantidadedoses` | INTEGER | YES | - | CHECK (> 0) | Número de doses necessárias |
| `intervalodoses` | INTEGER | YES | - | CHECK (>= 0) | Intervalo entre doses (dias) |
| `descricao` | TEXT | YES | - | - | Descrição da vacina |
| `status` | `vacina_status` | NO | 'ATIVA' | ENUM | Status (ATIVA/INATIVA) |

**Índices**:
```sql
CREATE INDEX idx_vacina_nome ON vacina(nome);
CREATE INDEX idx_vacina_status ON vacina(status);
CREATE INDEX idx_vacina_categoria ON vacina(categoria);
```

**RLS Policy**:
```sql
CREATE POLICY "Funcionarios podem gerenciar vacinas"
ON public.vacina
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### 4. `lote` - Tabela de Lotes de Vacinas

**Descrição**: Controla o estoque de vacinas por lote.

| Coluna | Tipo | Nullable | Default | Constraints | Descrição |
|--------|------|----------|---------|-------------|-----------|
| `numlote` | INTEGER | NO | `nextval('lote_numlote_seq')` | PRIMARY KEY, AUTO INCREMENT | Número único do lote |
| `codigolote` | VARCHAR(100) | NO | - | NOT NULL, UNIQUE | Código do lote do fabricante |
| `quantidadeinicial` | INTEGER | NO | - | NOT NULL, CHECK (>= 0) | Quantidade inicial do lote |
| `quantidadedisponivel` | INTEGER | NO | - | NOT NULL, CHECK (>= 0) | Quantidade disponível atual |
| `datavalidade` | DATE | NO | - | NOT NULL | Data de validade do lote |
| `precocompra` | NUMERIC(10,2) | NO | 0 | NOT NULL | Preço de compra (IMUTÁVEL após criação) |
| `precovenda` | NUMERIC(10,2) | NO | 0 | NOT NULL | Preço de venda (EDITÁVEL) |
| `vacina_idvacina` | INTEGER | NO | - | FOREIGN KEY → `vacina(idvacina)` | Referência à vacina |

**Índices**:
```sql
CREATE UNIQUE INDEX idx_lote_codigo ON lote(codigolote);
CREATE INDEX idx_lote_vacina ON lote(vacina_idvacina);
CREATE INDEX idx_lote_validade ON lote(datavalidade);
CREATE INDEX idx_lote_disponivel ON lote(quantidadedisponivel);
```

**Triggers**:
- `valida_lote()` - BEFORE INSERT/UPDATE - Valida data de validade (não pode estar vencido)

**Foreign Keys**:
```sql
ALTER TABLE lote
ADD CONSTRAINT fk_lote_vacina
FOREIGN KEY (vacina_idvacina)
REFERENCES vacina(idvacina)
ON DELETE CASCADE;
```

**RLS Policy**:
```sql
CREATE POLICY "Funcionarios podem gerenciar lotes"
ON public.lote
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Regra de Negócio Importante**:
- `precocompra` é **IMUTÁVEL** após a criação do lote
- `precovenda` é **EDITÁVEL** a qualquer momento
- `quantidadedisponivel` é decrementado ao criar agendamento
- `quantidadedisponivel` é incrementado ao cancelar agendamento

---

### 5. `agendamento` - Tabela de Agendamentos

**Descrição**: Armazena os agendamentos de vacinação.

| Coluna | Tipo | Nullable | Default | Constraints | Descrição |
|--------|------|----------|---------|-------------|-----------|
| `idagendamento` | INTEGER | NO | `nextval('agendamento_idagendamento_seq')` | PRIMARY KEY, AUTO INCREMENT | ID único do agendamento |
| `dataagendada` | TIMESTAMP | NO | - | NOT NULL | Data e hora agendadas |
| `status` | `agendamento_status` | NO | 'AGENDADO' | ENUM | Status (AGENDADO/REALIZADO) |
| `observacoes` | TEXT | YES | - | - | Observações |
| `cliente_cpf` | VARCHAR(11) | NO | - | FOREIGN KEY → `cliente(cpf)` | CPF do cliente |
| `funcionario_idfuncionario` | INTEGER | YES | - | FOREIGN KEY → `funcionario(idfuncionario)` | ID do funcionário (**NULLABLE**) |
| `lote_numlote` | INTEGER | NO | - | FOREIGN KEY → `lote(numlote)` | Número do lote |

**Índices**:
```sql
CREATE INDEX idx_agendamento_data ON agendamento(dataagendada);
CREATE INDEX idx_agendamento_status ON agendamento(status);
CREATE INDEX idx_agendamento_cliente ON agendamento(cliente_cpf);
CREATE INDEX idx_agendamento_lote ON agendamento(lote_numlote);
```

**Triggers**:
- `valida_agendamento()` - BEFORE INSERT/UPDATE - Valida que data é no futuro
- `reserva_estoque_ao_agendar()` - AFTER INSERT - Decrementa `lote.quantidadedisponivel`
- `retorna_estoque_ao_cancelar()` - BEFORE DELETE - Incrementa `lote.quantidadedisponivel` se status = 'AGENDADO'

**Foreign Keys**:
```sql
ALTER TABLE agendamento
ADD CONSTRAINT fk_agendamento_cliente
FOREIGN KEY (cliente_cpf)
REFERENCES cliente(cpf)
ON DELETE CASCADE;

ALTER TABLE agendamento
ADD CONSTRAINT fk_agendamento_funcionario
FOREIGN KEY (funcionario_idfuncionario)
REFERENCES funcionario(idfuncionario)
ON DELETE SET NULL;

ALTER TABLE agendamento
ADD CONSTRAINT fk_agendamento_lote
FOREIGN KEY (lote_numlote)
REFERENCES lote(numlote)
ON DELETE RESTRICT;
```

**RLS Policy**:
```sql
CREATE POLICY "Funcionarios podem gerenciar agendamentos"
ON public.agendamento
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Regra de Negócio Importante**:
- `funcionario_idfuncionario` é **NULLABLE** (não é obrigatório ao criar o agendamento)
- O funcionário só precisa ser definido no momento da aplicação
- Ao criar aplicação, o agendamento é **DELETADO AUTOMATICAMENTE**

---

### 6. `aplicacao` - Tabela de Aplicações de Vacinas

**Descrição**: Registra as aplicações de vacinas realizadas.

| Coluna | Tipo | Nullable | Default | Constraints | Descrição |
|--------|------|----------|---------|-------------|-----------|
| `idaplicacao` | INTEGER | NO | `nextval('aplicacao_idaplicacao_seq')` | PRIMARY KEY, AUTO INCREMENT | ID único da aplicação |
| `dataaplicacao` | DATE | NO | - | NOT NULL | Data da aplicação |
| `dose` | INTEGER | YES | - | CHECK (> 0) | Número da dose |
| `reacoesadversas` | TEXT | YES | - | - | Reações adversas observadas |
| `observacoes` | TEXT | YES | - | - | Observações gerais |
| `funcionario_idfuncionario` | INTEGER | NO | - | FOREIGN KEY → `funcionario(idfuncionario)` | Funcionário que aplicou |
| `cliente_cpf` | VARCHAR(11) | NO | - | FOREIGN KEY → `cliente(cpf)` | CPF do cliente |
| `agendamento_idagendamento` | INTEGER | YES | - | FOREIGN KEY → `agendamento(idagendamento)` | ID do agendamento relacionado |

**Índices**:
```sql
CREATE INDEX idx_aplicacao_data ON aplicacao(dataaplicacao);
CREATE INDEX idx_aplicacao_cliente ON aplicacao(cliente_cpf);
CREATE INDEX idx_aplicacao_funcionario ON aplicacao(funcionario_idfuncionario);
```

**Triggers**:
- `valida_aplicacao()` - BEFORE INSERT/UPDATE - Valida que data não é futura
- `finaliza_agendamento_apos_aplicacao()` - AFTER INSERT - Marca agendamento como REALIZADO e deleta

**Foreign Keys**:
```sql
ALTER TABLE aplicacao
ADD CONSTRAINT fk_aplicacao_funcionario
FOREIGN KEY (funcionario_idfuncionario)
REFERENCES funcionario(idfuncionario)
ON DELETE RESTRICT;

ALTER TABLE aplicacao
ADD CONSTRAINT fk_aplicacao_cliente
FOREIGN KEY (cliente_cpf)
REFERENCES cliente(cpf)
ON DELETE RESTRICT;

ALTER TABLE aplicacao
ADD CONSTRAINT fk_aplicacao_agendamento
FOREIGN KEY (agendamento_idagendamento)
REFERENCES agendamento(idagendamento)
ON DELETE SET NULL;
```

**RLS Policy**:
```sql
CREATE POLICY "Funcionarios podem gerenciar aplicacoes"
ON public.aplicacao
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### 7. `historico_aplicacoes_cliente` - Tabela de Histórico

**Descrição**: Armazena histórico de aplicações quando um cliente é deletado.

| Coluna | Tipo | Nullable | Default | Constraints | Descrição |
|--------|------|----------|---------|-------------|-----------|
| `idhistorico` | INTEGER | NO | `nextval('historico_aplicacoes_cliente_idhistorico_seq')` | PRIMARY KEY, AUTO INCREMENT | ID único do histórico |
| `cliente_cpf_deletado` | VARCHAR(11) | NO | - | NOT NULL | CPF do cliente deletado |
| `idaplicacao_hist` | INTEGER | NO | - | NOT NULL | ID da aplicação original |
| `dataaplicacao_hist` | DATE | YES | - | - | Data da aplicação |
| `dose_hist` | INTEGER | YES | - | - | Dose aplicada |
| `idagendamento_hist` | INTEGER | YES | - | - | ID do agendamento original |
| `idfuncionario_hist` | INTEGER | YES | - | - | ID do funcionário que aplicou |
| `data_exclusao_cliente` | TIMESTAMP | YES | - | - | Data/hora da exclusão do cliente |

**Índices**:
```sql
CREATE INDEX idx_historico_cpf ON historico_aplicacoes_cliente(cliente_cpf_deletado);
CREATE INDEX idx_historico_data_exclusao ON historico_aplicacoes_cliente(data_exclusao_cliente);
```

**RLS Policy**:
```sql
CREATE POLICY "Funcionarios podem visualizar historico"
ON public.historico_aplicacoes_cliente
FOR SELECT
TO authenticated
USING (true);
```

**Nota**: Esta tabela é **somente leitura** via API. Inserções são feitas automaticamente pelo trigger ao deletar cliente.

---

## 🎭 Enums (Tipos Enumerados)

### 1. `agendamento_status`
```sql
CREATE TYPE agendamento_status AS ENUM ('AGENDADO', 'REALIZADO');
```
- **AGENDADO**: Agendamento criado, aguardando realização
- **REALIZADO**: Vacina foi aplicada (status temporário antes de deletar o registro)

### 2. `cliente_status`
```sql
CREATE TYPE cliente_status AS ENUM ('ATIVO', 'INATIVO');
```
- **ATIVO**: Cliente ativo no sistema
- **INATIVO**: Cliente inativo (não aparece em listas principais)

### 3. `funcionario_status`
```sql
CREATE TYPE funcionario_status AS ENUM ('ATIVO', 'INATIVO');
```
- **ATIVO**: Funcionário ativo
- **INATIVO**: Funcionário inativo (não pode fazer login)

### 4. `vacina_categoria`
```sql
CREATE TYPE vacina_categoria AS ENUM ('VIRAL', 'BACTERIANA', 'OUTRA');
```
- **VIRAL**: Vacina contra vírus (ex: COVID, Gripe)
- **BACTERIANA**: Vacina contra bactérias (ex: Tétano)
- **OUTRA**: Outras categorias

### 5. `vacina_status`
```sql
CREATE TYPE vacina_status AS ENUM ('ATIVA', 'INATIVA');
```
- **ATIVA**: Vacina disponível para agendamento
- **INATIVA**: Vacina não disponível

---

## ⚙️ Triggers e Funções

### 1. `valida_cliente()` - BEFORE INSERT/UPDATE

**Propósito**: Validar que data de nascimento não é no futuro.

```sql
CREATE OR REPLACE FUNCTION public.valida_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.dataNasc IS NOT NULL AND NEW.dataNasc > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de nascimento não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_cliente
BEFORE INSERT OR UPDATE ON public.cliente
FOR EACH ROW
EXECUTE FUNCTION public.valida_cliente();
```

**Quando dispara**: Antes de inserir ou atualizar cliente  
**Validação**: `dataNasc` não pode ser > `CURRENT_DATE`  
**Erro**: Exception com mensagem amigável

---

### 2. `valida_funcionario()` - BEFORE INSERT/UPDATE

**Propósito**: Validar que data de admissão não é no futuro.

```sql
CREATE OR REPLACE FUNCTION public.valida_funcionario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.dataAdmissao IS NOT NULL AND NEW.dataAdmissao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de admissão não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_funcionario
BEFORE INSERT OR UPDATE ON public.funcionario
FOR EACH ROW
EXECUTE FUNCTION public.valida_funcionario();
```

**Quando dispara**: Antes de inserir ou atualizar funcionário  
**Validação**: `dataAdmissao` não pode ser > `CURRENT_DATE`

---

### 3. `valida_lote()` - BEFORE INSERT/UPDATE

**Propósito**: Validar que data de validade não está vencida.

```sql
CREATE OR REPLACE FUNCTION public.valida_lote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.dataValidade < CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de validade não pode ser anterior à data atual. Lote vencido.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_lote
BEFORE INSERT OR UPDATE ON public.lote
FOR EACH ROW
EXECUTE FUNCTION public.valida_lote();
```

**Quando dispara**: Antes de inserir ou atualizar lote  
**Validação**: `dataValidade` não pode ser < `CURRENT_DATE`  
**Nota**: Impede criação de lotes vencidos

---

### 4. `valida_agendamento()` - BEFORE INSERT/UPDATE

**Propósito**: Validar que data agendada é no futuro.

```sql
CREATE OR REPLACE FUNCTION public.valida_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.dataAgendada <= NOW() THEN
        RAISE EXCEPTION 'A data do agendamento deve ser no futuro.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_agendamento
BEFORE INSERT OR UPDATE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.valida_agendamento();
```

**Quando dispara**: Antes de inserir ou atualizar agendamento  
**Validação**: `dataAgendada` deve ser > `NOW()`  
**Nota**: Impede agendar em datas passadas

---

### 5. `valida_aplicacao()` - BEFORE INSERT/UPDATE

**Propósito**: Validar que data de aplicação não é no futuro.

```sql
CREATE OR REPLACE FUNCTION public.valida_aplicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.dataAplicacao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data da aplicação não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_aplicacao
BEFORE INSERT OR UPDATE ON public.aplicacao
FOR EACH ROW
EXECUTE FUNCTION public.valida_aplicacao();
```

**Quando dispara**: Antes de inserir ou atualizar aplicação  
**Validação**: `dataAplicacao` não pode ser > `CURRENT_DATE`

---

### 6. `reserva_estoque_ao_agendar()` - AFTER INSERT

**Propósito**: Reservar uma dose do estoque ao criar agendamento.

```sql
CREATE OR REPLACE FUNCTION public.reserva_estoque_ao_agendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    disponivel INT;
BEGIN
    SELECT quantidadeDisponivel INTO disponivel 
    FROM public.Lote 
    WHERE numLote = NEW.Lote_numLote;
    
    IF disponivel <= 0 THEN
        RAISE EXCEPTION 'Não há vacinas disponíveis neste lote para agendamento.';
    ELSE
        UPDATE public.Lote 
        SET quantidadeDisponivel = quantidadeDisponivel - 1 
        WHERE numLote = NEW.Lote_numLote;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_reserva_estoque
AFTER INSERT ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.reserva_estoque_ao_agendar();
```

**Quando dispara**: Após inserir agendamento  
**Ação**: Decrementa `lote.quantidadeDisponivel` em 1  
**Validação**: Verifica se há estoque disponível antes

---

### 7. `retorna_estoque_ao_cancelar()` - BEFORE DELETE

**Propósito**: Devolver dose ao estoque se agendamento for cancelado.

```sql
CREATE OR REPLACE FUNCTION public.retorna_estoque_ao_cancelar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF OLD.status = 'AGENDADO' THEN
        UPDATE public.Lote 
        SET quantidadeDisponivel = quantidadeDisponivel + 1 
        WHERE numLote = OLD.Lote_numLote;
    END IF;
    
    RETURN OLD;
END;
$function$;

CREATE TRIGGER trg_retorna_estoque
BEFORE DELETE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.retorna_estoque_ao_cancelar();
```

**Quando dispara**: Antes de deletar agendamento  
**Ação**: Se `status = 'AGENDADO'`, incrementa `lote.quantidadeDisponivel` em 1  
**Nota**: Não devolve estoque se status já era 'REALIZADO'

---

### 8. `finaliza_agendamento_apos_aplicacao()` - AFTER INSERT

**Propósito**: Marcar agendamento como REALIZADO e deletá-lo após criar aplicação.

```sql
CREATE OR REPLACE FUNCTION public.finaliza_agendamento_apos_aplicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    UPDATE public.Agendamento 
    SET status = 'REALIZADO' 
    WHERE idAgendamento = NEW.Agendamento_idAgendamento;
    
    DELETE FROM public.Agendamento 
    WHERE idAgendamento = NEW.Agendamento_idAgendamento;
    
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_finaliza_agendamento
AFTER INSERT ON public.aplicacao
FOR EACH ROW
EXECUTE FUNCTION public.finaliza_agendamento_apos_aplicacao();
```

**Quando dispara**: Após inserir aplicação  
**Ação**:  
1. Atualiza `agendamento.status` para 'REALIZADO'
2. Deleta o registro de agendamento

**Nota**: O estoque **NÃO** é devolvido pois já foi consumido na aplicação

---

### 9. `log_aplicacoes_antes_deletar_cliente()` - BEFORE DELETE

**Propósito**: Salvar histórico de aplicações antes de deletar cliente.

```sql
CREATE OR REPLACE FUNCTION public.log_aplicacoes_antes_deletar_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.Historico_Aplicacoes_Cliente 
        (cliente_CPF_deletado, idAplicacao_hist, dataAplicacao_hist, 
         dose_hist, idAgendamento_hist, idFuncionario_hist, data_exclusao_cliente)
    SELECT 
        OLD.CPF, 
        idAplicacao, 
        dataAplicacao, 
        dose, 
        Agendamento_idAgendamento, 
        Funcionario_idFuncionario, 
        NOW()
    FROM public.Aplicacao
    WHERE Cliente_CPF = OLD.CPF;
    
    RETURN OLD;
END;
$function$;

CREATE TRIGGER trg_log_aplicacoes
BEFORE DELETE ON public.cliente
FOR EACH ROW
EXECUTE FUNCTION public.log_aplicacoes_antes_deletar_cliente();
```

**Quando dispara**: Antes de deletar cliente  
**Ação**: Copia todas as aplicações do cliente para `historico_aplicacoes_cliente`  
**Nota**: Preserva histórico médico mesmo após exclusão do cliente

---

## 🔒 Row Level Security (RLS) - Resumo

Todas as 7 tabelas têm RLS **HABILITADO**, mas com políticas **PERMISSIVAS**:

```sql
-- Padrão atual em todas as tabelas
CREATE POLICY "Funcionarios podem gerenciar [tabela]"
ON public.[tabela]
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### ⚠️ ATENÇÃO: Políticas Precisam Ser Melhoradas

As políticas atuais permitem que **qualquer usuário autenticado** faça **qualquer operação**. Isso é adequado apenas para desenvolvimento.

### Políticas Recomendadas para Produção em C#:

```sql
-- 1. Criar enum de roles
CREATE TYPE app_role AS ENUM ('admin', 'vacinador', 'atendente');

-- 2. Criar tabela de roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    UNIQUE(user_id, role)
);

-- 3. Função para verificar role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
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

-- 4. Políticas por operação (exemplo: cliente)
-- SELECT: Todos os funcionários
CREATE POLICY "Funcionarios podem ver clientes"
ON public.cliente
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE: Atendentes e Admins
CREATE POLICY "Atendentes podem criar/editar clientes"
ON public.cliente
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'atendente') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Atendentes podem atualizar clientes"
ON public.cliente
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'atendente') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'atendente') OR has_role(auth.uid(), 'admin'));

-- DELETE: Apenas Admins
CREATE POLICY "Apenas admins podem deletar clientes"
ON public.cliente
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
```

---

## 📊 Scripts SQL Completos para C#

### Script de Criação Completo

```sql
-- ========================================
-- VIXCLINIC DATABASE SCHEMA
-- PostgreSQL 15
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

-- 3. CRIAR ÍNDICES (resto dos índices no documento)
-- ... keep existing code
```

---

## 📈 Diagrama de Fluxo de Dados

```
┌─────────────┐
│   Cliente   │──┐
└─────────────┘  │
                 │
                 ▼
           ┌─────────────┐      ┌──────────┐
           │ Agendamento │──────▶│  Lote    │
           └──────┬──────┘      └────┬─────┘
                  │                  │
                  │                  ▼
                  │            ┌──────────┐
                  │            │  Vacina  │
                  │            └──────────┘
                  │
                  ▼
           ┌──────────────┐
           │  Aplicação   │
           └──────────────┘
                  │
                  ▼
           ┌──────────────────┐
           │ Histórico (após  │
           │ delete cliente)  │
           └──────────────────┘
```

---

**Documento gerado em**: 2025-10-14  
**Versão do Sistema**: 1.0.0
