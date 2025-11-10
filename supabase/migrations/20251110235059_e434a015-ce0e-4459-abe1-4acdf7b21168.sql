-- Criar função que atualiza o estoque após aplicação de vacina
CREATE OR REPLACE FUNCTION public.atualiza_estoque_apos_aplicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    -- Verificar se há estoque disponível
    IF EXISTS (
        SELECT 1 FROM public.lote 
        WHERE numlote = NEW.lote_numlote 
        AND quantidadedisponivel <= 0
    ) THEN
        RAISE EXCEPTION 'Não há vacinas disponíveis neste lote para aplicação.';
    END IF;
    
    -- Diminuir o estoque disponível
    UPDATE public.lote 
    SET quantidadedisponivel = quantidadedisponivel - 1 
    WHERE numlote = NEW.lote_numlote;
    
    RETURN NEW;
END;
$$;

-- Criar trigger que executa após inserção de aplicação
CREATE TRIGGER trigger_atualiza_estoque_apos_aplicacao
    AFTER INSERT ON public.aplicacao
    FOR EACH ROW
    WHEN (NEW.lote_numlote IS NOT NULL)
    EXECUTE FUNCTION public.atualiza_estoque_apos_aplicacao();