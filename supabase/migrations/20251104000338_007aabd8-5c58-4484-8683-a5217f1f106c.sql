-- CORREÇÃO: Remove trigger e função que impede aplicações com data futura
-- Primeiro dropa o trigger
DROP TRIGGER IF EXISTS trg_valida_aplicacao ON public.aplicacao;
-- Depois dropa a função com CASCADE para remover dependências
DROP FUNCTION IF EXISTS public.valida_aplicacao() CASCADE;