-- Remove constraint antiga de agendamento
ALTER TABLE public.agendamento 
DROP CONSTRAINT IF EXISTS agendamento_cliente_cpf_fkey;

-- Adiciona nova constraint com ON DELETE CASCADE
ALTER TABLE public.agendamento
ADD CONSTRAINT agendamento_cliente_cpf_fkey 
FOREIGN KEY (cliente_cpf) 
REFERENCES public.cliente(cpf) 
ON DELETE CASCADE;