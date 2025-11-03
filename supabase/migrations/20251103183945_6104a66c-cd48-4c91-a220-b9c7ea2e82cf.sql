-- Adicionar coluna COREN na tabela funcionario
ALTER TABLE public.funcionario 
ADD COLUMN coren VARCHAR(20);

-- Remover coluna senha que não é mais necessária
ALTER TABLE public.funcionario 
DROP COLUMN IF EXISTS senha;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.funcionario.coren IS 'Conselho Regional de Enfermagem';