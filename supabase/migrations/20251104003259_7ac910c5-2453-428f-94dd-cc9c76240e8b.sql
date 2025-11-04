-- Remover triggers duplicados da tabela agendamento
DROP TRIGGER IF EXISTS trigger_reserva_estoque ON public.agendamento;
DROP TRIGGER IF EXISTS trigger_retorna_estoque ON public.agendamento;

-- Os triggers corretos já existem:
-- ✅ trg_reserva_estoque (BEFORE INSERT)
-- ✅ trg_retorna_estoque (BEFORE DELETE)
-- ✅ trg_finaliza_agendamento (AFTER INSERT na aplicacao)