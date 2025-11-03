
-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS trigger_reserva_estoque ON public.agendamento;
DROP TRIGGER IF EXISTS trigger_retorna_estoque ON public.agendamento;
DROP TRIGGER IF EXISTS trigger_finaliza_agendamento ON public.aplicacao;

-- Criar trigger para reservar estoque ao criar agendamento
CREATE TRIGGER trigger_reserva_estoque
AFTER INSERT ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.reserva_estoque_ao_agendar();

-- Criar trigger para devolver estoque ao deletar agendamento (só se status = AGENDADO)
CREATE TRIGGER trigger_retorna_estoque
BEFORE DELETE ON public.agendamento
FOR EACH ROW
EXECUTE FUNCTION public.retorna_estoque_ao_cancelar();
