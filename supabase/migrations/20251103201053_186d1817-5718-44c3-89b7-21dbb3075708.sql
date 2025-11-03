
-- Remover triggers duplicados antigos
DROP TRIGGER IF EXISTS trg_reserva_estoque ON public.agendamento;
DROP TRIGGER IF EXISTS trg_retorna_estoque ON public.agendamento;
DROP TRIGGER IF EXISTS trg_finaliza_agendamento ON public.aplicacao;

-- Manter apenas os triggers corretos (já existem)
-- trigger_reserva_estoque - OK
-- trigger_retorna_estoque - OK  
-- trigger_diminui_total - OK
