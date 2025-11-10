-- Alterar coluna dataaplicacao de DATE para TIMESTAMP para incluir hora
ALTER TABLE public.aplicacao 
ALTER COLUMN dataaplicacao TYPE timestamp without time zone 
USING dataaplicacao::timestamp;