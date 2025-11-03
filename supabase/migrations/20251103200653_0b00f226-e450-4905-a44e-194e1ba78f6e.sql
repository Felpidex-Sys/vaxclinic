
-- Corrigir função para diminuir apenas disponível ao agendar
CREATE OR REPLACE FUNCTION public.reserva_estoque_ao_agendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
        -- Ao agendar: diminui APENAS das disponíveis
        UPDATE public.lote 
        SET quantidadedisponivel = quantidadedisponivel - 1 
        WHERE numlote = NEW.lote_numlote;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Corrigir função para devolver apenas disponível ao cancelar
CREATE OR REPLACE FUNCTION public.retorna_estoque_ao_cancelar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- Só retorna estoque disponível se o agendamento estava AGENDADO
    IF OLD.status = 'AGENDADO' THEN
        UPDATE public.lote 
        SET quantidadedisponivel = quantidadedisponivel + 1 
        WHERE numlote = OLD.lote_numlote;
    END IF;
    
    RETURN OLD;
END;
$function$;

-- Criar função para diminuir total ao confirmar aplicação
CREATE OR REPLACE FUNCTION public.diminui_total_ao_confirmar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    lote_num INT;
BEGIN
    -- Buscar o lote do agendamento confirmado
    SELECT lote_numlote INTO lote_num
    FROM public.agendamento
    WHERE idagendamento = NEW.agendamento_idagendamento;
    
    -- Diminuir da quantidade inicial (total)
    IF lote_num IS NOT NULL THEN
        UPDATE public.lote 
        SET quantidadeinicial = quantidadeinicial - 1
        WHERE numlote = lote_num;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar trigger para diminuir total quando aplicação é confirmada
DROP TRIGGER IF EXISTS trigger_diminui_total ON public.aplicacao;
CREATE TRIGGER trigger_diminui_total
AFTER INSERT ON public.aplicacao
FOR EACH ROW
EXECUTE FUNCTION public.diminui_total_ao_confirmar();
