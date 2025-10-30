
-- ========================================
-- VIXCLINIC DATABASE SCHEMA COMPLETO
-- Recriação completa seguindo docs/DATABASE_SCHEMA.md
-- ========================================

-- PASSO 1: REMOVER TUDO (CLEAN SLATE)
-- ========================================

-- Remover triggers
DROP TRIGGER IF EXISTS trg_valida_cliente ON public.cliente;
DROP TRIGGER IF EXISTS trg_valida_funcionario ON public.funcionario;
DROP TRIGGER IF EXISTS trg_valida_lote ON public.lote;
DROP TRIGGER IF EXISTS trg_valida_agendamento ON public.agendamento;
DROP TRIGGER IF EXISTS trg_valida_aplicacao ON public.aplicacao;
DROP TRIGGER IF EXISTS trg_reserva_estoque ON public.agendamento;
DROP TRIGGER IF EXISTS trg_retorna_estoque ON public.agendamento;
DROP TRIGGER IF EXISTS trg_finaliza_agendamento ON public.aplicacao;
DROP TRIGGER IF EXISTS trg_log_aplicacoes ON public.cliente;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_roles_updated_at_trigger ON public.user_roles;

-- Remover funções antigas
DROP FUNCTION IF EXISTS public.valida_cliente() CASCADE;
DROP FUNCTION IF EXISTS public.valida_funcionario() CASCADE;
DROP FUNCTION IF EXISTS public.valida_lote() CASCADE;
DROP FUNCTION IF EXISTS public.valida_agendamento() CASCADE;
DROP FUNCTION IF EXISTS public.valida_aplicacao() CASCADE;
DROP FUNCTION IF EXISTS public.reserva_estoque_ao_agendar() CASCADE;
DROP FUNCTION IF EXISTS public.retorna_estoque_ao_cancelar() CASCADE;
DROP FUNCTION IF EXISTS public.finaliza_agendamento_apos_aplicacao() CASCADE;
DROP FUNCTION IF EXISTS public.log_aplicacoes_antes_deletar_cliente() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_roles_updated_at() CASCADE;

-- Remover tabelas
DROP TABLE IF EXISTS public.aplicacao CASCADE;
DROP TABLE IF EXISTS public.agendamento CASCADE;
DROP TABLE IF EXISTS public.lote CASCADE;
DROP TABLE IF EXISTS public.vacina CASCADE;
DROP TABLE IF EXISTS public.historico_aplicacoes_cliente CASCADE;
DROP TABLE IF EXISTS public.cliente CASCADE;
DROP TABLE IF EXISTS public.funcionario CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Remover enums antigos
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS agendamento_status CASCADE;
DROP TYPE IF EXISTS cliente_status CASCADE;
DROP TYPE IF EXISTS funcionario_status CASCADE;
DROP TYPE IF EXISTS vacina_categoria CASCADE;
DROP TYPE IF EXISTS vacina_status CASCADE;

-- PASSO 2: CRIAR ENUMS
-- ========================================

CREATE TYPE agendamento_status AS ENUM ('AGENDADO', 'REALIZADO');
CREATE TYPE cliente_status AS ENUM ('ATIVO', 'INATIVO');
CREATE TYPE funcionario_status AS ENUM ('ATIVO', 'INATIVO');
CREATE TYPE vacina_categoria AS ENUM ('VIRAL', 'BACTERIANA', 'OUTRA');
CREATE TYPE vacina_status AS ENUM ('ATIVA', 'INATIVA');

-- PASSO 3: CRIAR TABELAS
-- ========================================

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

-- Tabela: funcionario (SEM user_id - sistema próprio de login)
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

-- PASSO 4: CRIAR ÍNDICES
-- ========================================

-- Índices para cliente
CREATE INDEX idx_cliente_nome ON cliente(nomecompleto);
CREATE INDEX idx_cliente_status ON cliente(status);

-- Índices para funcionario
CREATE UNIQUE INDEX idx_funcionario_email ON funcionario(email);
CREATE UNIQUE INDEX idx_funcionario_cpf ON funcionario(cpf);
CREATE INDEX idx_funcionario_status ON funcionario(status);

-- Índices para vacina
CREATE INDEX idx_vacina_nome ON vacina(nome);
CREATE INDEX idx_vacina_status ON vacina(status);
CREATE INDEX idx_vacina_categoria ON vacina(categoria);

-- Índices para lote
CREATE UNIQUE INDEX idx_lote_codigo ON lote(codigolote);
CREATE INDEX idx_lote_vacina ON lote(vacina_idvacina);
CREATE INDEX idx_lote_validade ON lote(datavalidade);
CREATE INDEX idx_lote_disponivel ON lote(quantidadedisponivel);

-- Índices para agendamento
CREATE INDEX idx_agendamento_data ON agendamento(dataagendada);
CREATE INDEX idx_agendamento_status ON agendamento(status);
CREATE INDEX idx_agendamento_cliente ON agendamento(cliente_cpf);
CREATE INDEX idx_agendamento_lote ON agendamento(lote_numlote);

-- Índices para aplicacao
CREATE INDEX idx_aplicacao_data ON aplicacao(dataaplicacao);
CREATE INDEX idx_aplicacao_cliente ON aplicacao(cliente_cpf);
CREATE INDEX idx_aplicacao_funcionario ON aplicacao(funcionario_idfuncionario);

-- Índices para historico
CREATE INDEX idx_historico_cpf ON historico_aplicacoes_cliente(cliente_cpf_deletado);
CREATE INDEX idx_historico_data_exclusao ON historico_aplicacoes_cliente(data_exclusao_cliente);

-- PASSO 5: CRIAR FUNÇÕES E TRIGGERS
-- ========================================

-- 1. Validação de Cliente
CREATE OR REPLACE FUNCTION public.valida_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NEW.datanasc IS NOT NULL AND NEW.datanasc > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de nascimento não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_cliente
BEFORE INSERT OR UPDATE ON public.cliente
FOR EACH ROW
EXECUTE FUNCTION public.valida_cliente();

-- 2. Validação de Funcionário
CREATE OR REPLACE FUNCTION public.valida_funcionario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NEW.dataadmissao IS NOT NULL AND NEW.dataadmissao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de admissão não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_funcionario
BEFORE INSERT OR UPDATE ON public.funcionario
FOR EACH ROW
EXECUTE FUNCTION public.valida_funcionario();

-- 3. Validação de Lote
CREATE OR REPLACE FUNCTION public.valida_lote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NEW.datavalidade < CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de validade não pode ser anterior à data atual. Lote vencido.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_lote
BEFORE INSERT OR UPDATE ON public.lote
FOR EACH ROW
EXECUTE FUNCTION public.valida_lote();

-- 4. Validação de Agendamento
CREATE OR REPLACE FUNCTION public.valida_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NEW.dataagendada <= NOW() THEN
        RAISE EXCEPTION 'A data do agendamento deve ser no futuro.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_agendamento
BEFORE INSERT OR UPDATE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.valida_agendamento();

-- 5. Validação de Aplicação
CREATE OR REPLACE FUNCTION public.valida_aplicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NEW.dataaplicacao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data da aplicação não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_valida_aplicacao
BEFORE INSERT OR UPDATE ON public.aplicacao
FOR EACH ROW
EXECUTE FUNCTION public.valida_aplicacao();

-- 6. Reserva de Estoque
CREATE OR REPLACE FUNCTION public.reserva_estoque_ao_agendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE TRIGGER trg_reserva_estoque
AFTER INSERT ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.reserva_estoque_ao_agendar();

-- 7. Retorno de Estoque
CREATE OR REPLACE FUNCTION public.retorna_estoque_ao_cancelar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF OLD.status = 'AGENDADO' THEN
        UPDATE public.lote 
        SET quantidadedisponivel = quantidadedisponivel + 1 
        WHERE numlote = OLD.lote_numlote;
    END IF;
    
    RETURN OLD;
END;
$function$;

CREATE TRIGGER trg_retorna_estoque
BEFORE DELETE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.retorna_estoque_ao_cancelar();

-- 8. Finalização de Agendamento
CREATE OR REPLACE FUNCTION public.finaliza_agendamento_apos_aplicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    UPDATE public.agendamento 
    SET status = 'REALIZADO' 
    WHERE idagendamento = NEW.agendamento_idagendamento;
    
    DELETE FROM public.agendamento 
    WHERE idagendamento = NEW.agendamento_idagendamento;
    
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_finaliza_agendamento
AFTER INSERT ON public.aplicacao
FOR EACH ROW
EXECUTE FUNCTION public.finaliza_agendamento_apos_aplicacao();

-- 9. Log de Aplicações
CREATE OR REPLACE FUNCTION public.log_aplicacoes_antes_deletar_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE TRIGGER trg_log_aplicacoes
BEFORE DELETE ON public.cliente
FOR EACH ROW
EXECUTE FUNCTION public.log_aplicacoes_antes_deletar_cliente();

-- PASSO 6: HABILITAR RLS E CRIAR POLÍTICAS
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lote ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aplicacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_aplicacoes_cliente ENABLE ROW LEVEL SECURITY;

-- Políticas para cliente
CREATE POLICY "Funcionarios podem gerenciar clientes"
ON public.cliente
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para funcionario
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

-- Políticas para vacina
CREATE POLICY "Funcionarios podem gerenciar vacinas"
ON public.vacina
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para lote
CREATE POLICY "Funcionarios podem gerenciar lotes"
ON public.lote
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para agendamento
CREATE POLICY "Funcionarios podem gerenciar agendamentos"
ON public.agendamento
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para aplicacao
CREATE POLICY "Funcionarios podem gerenciar aplicacoes"
ON public.aplicacao
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para historico (somente leitura)
CREATE POLICY "Funcionarios podem visualizar historico"
ON public.historico_aplicacoes_cliente
FOR SELECT
TO authenticated
USING (true);
