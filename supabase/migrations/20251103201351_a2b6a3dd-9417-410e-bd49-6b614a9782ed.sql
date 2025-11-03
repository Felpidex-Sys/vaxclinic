
-- Adicionar logs para debug
CREATE OR REPLACE FUNCTION public.reserva_estoque_ao_agendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    disponivel INT;
    total_antes INT;
    total_depois INT;
BEGIN
    -- Verificar valores antes
    SELECT quantidadedisponivel, quantidadeinicial INTO disponivel, total_antes
    FROM public.lote 
    WHERE numlote = NEW.lote_numlote;
    
    IF disponivel <= 0 THEN
        RAISE EXCEPTION 'Não há vacinas disponíveis neste lote para agendamento.';
    ELSE
        -- Ao agendar: diminui APENAS das disponíveis
        UPDATE public.lote 
        SET quantidadedisponivel = quantidadedisponivel - 1 
        WHERE numlote = NEW.lote_numlote;
        
        -- Log para debug
        SELECT quantidadeinicial INTO total_depois
        FROM public.lote 
        WHERE numlote = NEW.lote_numlote;
        
        RAISE NOTICE 'AGENDAR - Lote %: Total antes=%, Total depois=%, Disponivel antes=%', 
            NEW.lote_numlote, total_antes, total_depois, disponivel;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.diminui_total_ao_confirmar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    lote_num INT;
    total_antes INT;
BEGIN
    -- Buscar o lote do agendamento confirmado
    SELECT lote_numlote INTO lote_num
    FROM public.agendamento
    WHERE idagendamento = NEW.agendamento_idagendamento;
    
    IF lote_num IS NOT NULL THEN
        SELECT quantidadeinicial INTO total_antes
        FROM public.lote 
        WHERE numlote = lote_num;
        
        -- Diminuir da quantidade inicial (total)
        UPDATE public.lote 
        SET quantidadeinicial = quantidadeinicial - 1
        WHERE numlote = lote_num;
        
        RAISE NOTICE 'CONFIRMAR - Lote %: Total antes=%, diminuindo 1', lote_num, total_antes;
    END IF;
    
    RETURN NEW;
END;
$function$;
