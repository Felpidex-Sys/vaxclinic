-- Primeiro, remove a constraint antiga
ALTER TABLE public.aplicacao 
DROP CONSTRAINT IF EXISTS aplicacao_cliente_cpf_fkey;

-- Adiciona nova constraint com ON DELETE CASCADE
-- Isso permitirá que o trigger funcione antes da deleção
ALTER TABLE public.aplicacao
ADD CONSTRAINT aplicacao_cliente_cpf_fkey 
FOREIGN KEY (cliente_cpf) 
REFERENCES public.cliente(cpf) 
ON DELETE CASCADE;

-- Garante que o trigger existe e está ativo
DROP TRIGGER IF EXISTS trigger_log_aplicacoes ON public.cliente;

CREATE TRIGGER trigger_log_aplicacoes
BEFORE DELETE ON public.cliente
FOR EACH ROW
EXECUTE FUNCTION public.log_aplicacoes_antes_deletar_cliente();