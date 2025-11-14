-- Remover o trigger antigo que bloqueava UPDATE
DROP TRIGGER IF EXISTS trg_valida_agendamento ON public.agendamento;

-- Recriar o trigger APENAS para INSERT (não mais UPDATE)
-- Isso permite que agendamentos passados sejam atualizados/finalizados
CREATE TRIGGER trg_valida_agendamento
BEFORE INSERT ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.valida_agendamento();