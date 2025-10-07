-- Permitir aplicações sem agendamento prévio
-- Remove a constraint UNIQUE de agendamento_idagendamento
ALTER TABLE public.aplicacao 
DROP CONSTRAINT IF EXISTS aplicacao_agendamento_idagendamento_key;

-- Torna a coluna agendamento_idagendamento nullable
ALTER TABLE public.aplicacao 
ALTER COLUMN agendamento_idagendamento DROP NOT NULL;