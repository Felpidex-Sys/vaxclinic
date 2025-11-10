-- Adicionar campo lote_numlote na tabela aplicacao para registrar o lote usado na aplicação
ALTER TABLE public.aplicacao 
ADD COLUMN lote_numlote integer REFERENCES public.lote(numlote);

-- Atualizar registros existentes: preencher lote_numlote a partir dos agendamentos
UPDATE public.aplicacao a
SET lote_numlote = ag.lote_numlote
FROM public.agendamento ag
WHERE a.agendamento_idagendamento = ag.idagendamento
AND a.lote_numlote IS NULL;