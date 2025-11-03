-- CORREÇÃO: Remove trigger que diminui quantidade inicial (incorreto)
DROP TRIGGER IF EXISTS trigger_diminui_total ON public.aplicacao;
DROP FUNCTION IF EXISTS public.diminui_total_ao_confirmar();

-- CORREÇÃO: Ajusta trigger para não deletar agendamento, apenas marcar como realizado
CREATE OR REPLACE FUNCTION public.finaliza_agendamento_apos_aplicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- Apenas atualiza status para REALIZADO, não deleta mais
    UPDATE public.agendamento 
    SET status = 'REALIZADO' 
    WHERE idagendamento = NEW.agendamento_idagendamento;
    
    RETURN NEW;
END;
$function$;

-- CORREÇÃO: Ajusta trigger de retorno de estoque
-- Agora também não retorna estoque se o agendamento foi realizado (aplicação confirmada)
CREATE OR REPLACE FUNCTION public.retorna_estoque_ao_cancelar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- Só retorna estoque disponível se o agendamento estava AGENDADO (não REALIZADO ou CANCELADO)
    IF OLD.status = 'AGENDADO' THEN
        UPDATE public.lote 
        SET quantidadedisponivel = quantidadedisponivel + 1 
        WHERE numlote = OLD.lote_numlote;
    END IF;
    
    RETURN OLD;
END;
$function$;