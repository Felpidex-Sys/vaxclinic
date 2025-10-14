-- Tornar funcionário opcional no agendamento (só será atribuído quando realizado)
ALTER TABLE public.agendamento
ALTER COLUMN funcionario_idfuncionario DROP NOT NULL;

-- Adicionar campos de preço ao lote
ALTER TABLE public.lote
ADD COLUMN precocompra DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN precovenda DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.lote.precocompra IS 'Preço de compra do lote (não pode ser alterado após cadastro)';
COMMENT ON COLUMN public.lote.precovenda IS 'Preço de venda do lote (pode ser alterado)';