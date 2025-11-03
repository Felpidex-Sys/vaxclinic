-- Corrigir trigger para não devolver estoque quando status for REALIZADO
DROP TRIGGER IF EXISTS trigger_retorna_estoque ON public.agendamento;

CREATE OR REPLACE FUNCTION public.retorna_estoque_ao_cancelar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- Só retorna estoque se o agendamento estava AGENDADO (cancelamento real)
    -- Não retorna se era REALIZADO (aplicação confirmada)
    IF OLD.status = 'AGENDADO' THEN
        UPDATE public.lote 
        SET quantidadedisponivel = quantidadedisponivel + 1 
        WHERE numlote = OLD.lote_numlote;
    END IF;
    
    RETURN OLD;
END;
$function$;

CREATE TRIGGER trigger_retorna_estoque 
BEFORE DELETE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.retorna_estoque_ao_cancelar();