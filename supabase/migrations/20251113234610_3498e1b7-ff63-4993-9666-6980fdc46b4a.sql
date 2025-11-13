-- Adicionar colunas de preços históricos na tabela aplicacao
ALTER TABLE aplicacao 
ADD COLUMN precocompra NUMERIC(10,2) NOT NULL DEFAULT 0,
ADD COLUMN precovenda NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Popular dados existentes com os preços atuais dos lotes
UPDATE aplicacao a
SET 
  precocompra = l.precocompra,
  precovenda = l.precovenda
FROM lote l
WHERE a.lote_numlote = l.numlote
  AND (a.precocompra = 0 OR a.precovenda = 0);