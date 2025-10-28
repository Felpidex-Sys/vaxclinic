-- Limpar todos os dados das tabelas (mantendo a estrutura)
DELETE FROM public.aplicacao;
DELETE FROM public.agendamento;
DELETE FROM public.historico_aplicacoes_cliente;
DELETE FROM public.lote;
DELETE FROM public.cliente;
DELETE FROM public.vacina;
DELETE FROM public.funcionario;
DELETE FROM public.user_roles;

-- Resetar as sequences
ALTER SEQUENCE IF EXISTS aplicacao_idaplicacao_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS agendamento_idagendamento_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS historico_aplicacoes_cliente_idhistorico_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS lote_numlote_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vacina_idvacina_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS funcionario_idfuncionario_seq RESTART WITH 1;