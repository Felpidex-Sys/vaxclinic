-- Limpar todos os dados das tabelas (respeitando ordem de foreign keys)

-- 1. Remover dados de tabelas que dependem de outras
DELETE FROM public.aplicacao;
DELETE FROM public.agendamento;
DELETE FROM public.historico_aplicacoes_cliente;

-- 2. Remover dados de tabelas referenciadas
DELETE FROM public.lote;
DELETE FROM public.cliente;
DELETE FROM public.funcionario;
DELETE FROM public.vacina;

-- 3. Resetar sequences para começar do 1 novamente
ALTER SEQUENCE aplicacao_idaplicacao_seq RESTART WITH 1;
ALTER SEQUENCE agendamento_idagendamento_seq RESTART WITH 1;
ALTER SEQUENCE funcionario_idfuncionario_seq RESTART WITH 1;
ALTER SEQUENCE historico_aplicacoes_cliente_idhistorico_seq RESTART WITH 1;
ALTER SEQUENCE lote_numlote_seq RESTART WITH 1;
ALTER SEQUENCE vacina_idvacina_seq RESTART WITH 1;

-- 4. Limpar usuários do auth (opcional - descomente se quiser limpar)
-- DELETE FROM auth.users;