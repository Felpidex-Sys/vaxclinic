-- Tornar a coluna funcionario_idfuncionario nullable na tabela agendamento
ALTER TABLE public.agendamento 
ALTER COLUMN funcionario_idfuncionario DROP NOT NULL;

-- Alterar a foreign key constraint para permitir null
ALTER TABLE public.agendamento 
DROP CONSTRAINT IF EXISTS agendamento_funcionario_idfuncionario_fkey;

ALTER TABLE public.agendamento 
ADD CONSTRAINT agendamento_funcionario_idfuncionario_fkey 
FOREIGN KEY (funcionario_idfuncionario) 
REFERENCES public.funcionario(idfuncionario) 
ON DELETE SET NULL;