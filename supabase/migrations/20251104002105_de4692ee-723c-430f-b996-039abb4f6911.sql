-- Criar triggers para gerenciamento de estoque e status de agendamento

-- 1) Trigger para reservar estoque ao criar agendamento
DROP TRIGGER IF EXISTS trg_reserva_estoque ON public.agendamento;
CREATE TRIGGER trg_reserva_estoque
BEFORE INSERT ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.reserva_estoque_ao_agendar();

-- 2) Trigger para retornar estoque ao deletar agendamento
DROP TRIGGER IF EXISTS trg_retorna_estoque ON public.agendamento;
CREATE TRIGGER trg_retorna_estoque
BEFORE DELETE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.retorna_estoque_ao_cancelar();

-- 3) Trigger para finalizar agendamento ao criar aplicação
DROP TRIGGER IF EXISTS trg_finaliza_agendamento ON public.aplicacao;
CREATE TRIGGER trg_finaliza_agendamento
AFTER INSERT ON public.aplicacao
FOR EACH ROW
EXECUTE FUNCTION public.finaliza_agendamento_apos_aplicacao();