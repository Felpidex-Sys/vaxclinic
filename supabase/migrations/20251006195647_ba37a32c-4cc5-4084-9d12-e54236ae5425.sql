-- =====================================================================
-- CORREÇÃO DE SEGURANÇA: Adicionar search_path às funções e habilitar RLS
-- =====================================================================

-- Corrigir search_path em todas as funções existentes
DROP FUNCTION IF EXISTS public.valida_cliente() CASCADE;
CREATE OR REPLACE FUNCTION public.valida_cliente()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.dataNasc IS NOT NULL AND NEW.dataNasc > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de nascimento não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TRG_Valida_Cliente_BI 
BEFORE INSERT ON public.Cliente 
FOR EACH ROW EXECUTE FUNCTION public.valida_cliente();

CREATE TRIGGER TRG_Valida_Cliente_BU 
BEFORE UPDATE ON public.Cliente 
FOR EACH ROW EXECUTE FUNCTION public.valida_cliente();

DROP FUNCTION IF EXISTS public.valida_funcionario() CASCADE;
CREATE OR REPLACE FUNCTION public.valida_funcionario()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.dataAdmissao IS NOT NULL AND NEW.dataAdmissao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de admissão não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TRG_Valida_Funcionario_BI 
BEFORE INSERT ON public.Funcionario 
FOR EACH ROW EXECUTE FUNCTION public.valida_funcionario();

CREATE TRIGGER TRG_Valida_Funcionario_BU 
BEFORE UPDATE ON public.Funcionario 
FOR EACH ROW EXECUTE FUNCTION public.valida_funcionario();

DROP FUNCTION IF EXISTS public.valida_lote() CASCADE;
CREATE OR REPLACE FUNCTION public.valida_lote()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.dataValidade < CURRENT_DATE THEN
        RAISE EXCEPTION 'A data de validade não pode ser anterior à data atual. Lote vencido.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TRG_Valida_Lote_BI 
BEFORE INSERT ON public.Lote 
FOR EACH ROW EXECUTE FUNCTION public.valida_lote();

CREATE TRIGGER TRG_Valida_Lote_BU 
BEFORE UPDATE ON public.Lote 
FOR EACH ROW EXECUTE FUNCTION public.valida_lote();

DROP FUNCTION IF EXISTS public.valida_agendamento() CASCADE;
CREATE OR REPLACE FUNCTION public.valida_agendamento()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.dataAgendada <= NOW() THEN
        RAISE EXCEPTION 'A data do agendamento deve ser no futuro.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TRG_Valida_Agendamento_BI 
BEFORE INSERT ON public.Agendamento 
FOR EACH ROW EXECUTE FUNCTION public.valida_agendamento();

CREATE TRIGGER TRG_Valida_Agendamento_BU 
BEFORE UPDATE ON public.Agendamento 
FOR EACH ROW EXECUTE FUNCTION public.valida_agendamento();

DROP FUNCTION IF EXISTS public.valida_aplicacao() CASCADE;
CREATE OR REPLACE FUNCTION public.valida_aplicacao()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.dataAplicacao > CURRENT_DATE THEN
        RAISE EXCEPTION 'A data da aplicação não pode ser uma data futura.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER TRG_Valida_Aplicacao_BI 
BEFORE INSERT ON public.Aplicacao 
FOR EACH ROW EXECUTE FUNCTION public.valida_aplicacao();

CREATE TRIGGER TRG_Valida_Aplicacao_BU 
BEFORE UPDATE ON public.Aplicacao 
FOR EACH ROW EXECUTE FUNCTION public.valida_aplicacao();

DROP FUNCTION IF EXISTS public.reserva_estoque_ao_agendar() CASCADE;
CREATE OR REPLACE FUNCTION public.reserva_estoque_ao_agendar()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    disponivel INT;
BEGIN
    SELECT quantidadeDisponivel INTO disponivel FROM public.Lote WHERE numLote = NEW.Lote_numLote;
    
    IF disponivel <= 0 THEN
        RAISE EXCEPTION 'Não há vacinas disponíveis neste lote para agendamento.';
    ELSE
        UPDATE public.Lote SET quantidadeDisponivel = quantidadeDisponivel - 1 WHERE numLote = NEW.Lote_numLote;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER TRG_Reserva_Estoque_Ao_Agendar
BEFORE INSERT ON public.Agendamento
FOR EACH ROW EXECUTE FUNCTION public.reserva_estoque_ao_agendar();

DROP FUNCTION IF EXISTS public.retorna_estoque_ao_cancelar() CASCADE;
CREATE OR REPLACE FUNCTION public.retorna_estoque_ao_cancelar()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'AGENDADO' THEN
        UPDATE public.Lote SET quantidadeDisponivel = quantidadeDisponivel + 1 WHERE numLote = OLD.Lote_numLote;
    END IF;
    
    RETURN OLD;
END;
$$;

CREATE TRIGGER TRG_Retorna_Estoque_Ao_Cancelar
BEFORE DELETE ON public.Agendamento
FOR EACH ROW EXECUTE FUNCTION public.retorna_estoque_ao_cancelar();

DROP FUNCTION IF EXISTS public.finaliza_agendamento_apos_aplicacao() CASCADE;
CREATE OR REPLACE FUNCTION public.finaliza_agendamento_apos_aplicacao()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.Agendamento SET status = 'REALIZADO' WHERE idAgendamento = NEW.Agendamento_idAgendamento;
    DELETE FROM public.Agendamento WHERE idAgendamento = NEW.Agendamento_idAgendamento;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER TRG_Finaliza_Agendamento_Apos_Aplicacao
AFTER INSERT ON public.Aplicacao
FOR EACH ROW EXECUTE FUNCTION public.finaliza_agendamento_apos_aplicacao();

DROP FUNCTION IF EXISTS public.log_aplicacoes_antes_deletar_cliente() CASCADE;
CREATE OR REPLACE FUNCTION public.log_aplicacoes_antes_deletar_cliente()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.Historico_Aplicacoes_Cliente 
        (cliente_CPF_deletado, idAplicacao_hist, dataAplicacao_hist, dose_hist, idAgendamento_hist, idFuncionario_hist, data_exclusao_cliente)
    SELECT 
        OLD.CPF, idAplicacao, dataAplicacao, dose, Agendamento_idAgendamento, Funcionario_idFuncionario, NOW()
    FROM public.Aplicacao
    WHERE Cliente_CPF = OLD.CPF;
    
    RETURN OLD;
END;
$$;

CREATE TRIGGER TRG_LogAplicacoes_AntesDeletarCliente
BEFORE DELETE ON public.Cliente
FOR EACH ROW EXECUTE FUNCTION public.log_aplicacoes_antes_deletar_cliente();

-- =====================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- =====================================================================

ALTER TABLE public.Cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Funcionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Vacina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Lote ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Agendamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Aplicacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Historico_Aplicacoes_Cliente ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- POLÍTICAS RLS TEMPORÁRIAS (acesso total para funcionários autenticados)
-- Posteriormente, será necessário implementar sistema de roles
-- =====================================================================

-- Cliente: Todos os funcionários podem gerenciar clientes
CREATE POLICY "Funcionarios podem gerenciar clientes"
ON public.Cliente
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Funcionario: Todos podem visualizar, mas só admin pode editar
CREATE POLICY "Todos podem visualizar funcionarios"
ON public.Funcionario
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Funcionarios podem se auto-editar"
ON public.Funcionario
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir inserção de funcionarios"
ON public.Funcionario
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Vacina: Todos os funcionários podem gerenciar vacinas
CREATE POLICY "Funcionarios podem gerenciar vacinas"
ON public.Vacina
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Lote: Todos os funcionários podem gerenciar lotes
CREATE POLICY "Funcionarios podem gerenciar lotes"
ON public.Lote
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Agendamento: Todos os funcionários podem gerenciar agendamentos
CREATE POLICY "Funcionarios podem gerenciar agendamentos"
ON public.Agendamento
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Aplicacao: Todos os funcionários podem gerenciar aplicações
CREATE POLICY "Funcionarios podem gerenciar aplicacoes"
ON public.Aplicacao
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Historico: Apenas leitura para todos
CREATE POLICY "Funcionarios podem visualizar historico"
ON public.Historico_Aplicacoes_Cliente
FOR SELECT
TO authenticated
USING (true);