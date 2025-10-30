-- Permitir acesso anônimo a todas as tabelas (sem autenticação)

-- Cliente
DROP POLICY IF EXISTS "Funcionarios podem gerenciar clientes" ON public.cliente;
CREATE POLICY "Permitir acesso total anonimo cliente" 
ON public.cliente 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Funcionário
DROP POLICY IF EXISTS "Todos podem visualizar funcionarios" ON public.funcionario;
DROP POLICY IF EXISTS "Permitir inserção de funcionarios" ON public.funcionario;
DROP POLICY IF EXISTS "Funcionarios podem se auto-editar" ON public.funcionario;
CREATE POLICY "Permitir acesso total anonimo funcionario" 
ON public.funcionario 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Vacina
DROP POLICY IF EXISTS "Funcionarios podem gerenciar vacinas" ON public.vacina;
CREATE POLICY "Permitir acesso total anonimo vacina" 
ON public.vacina 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Lote
DROP POLICY IF EXISTS "Funcionarios podem gerenciar lotes" ON public.lote;
CREATE POLICY "Permitir acesso total anonimo lote" 
ON public.lote 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Agendamento
DROP POLICY IF EXISTS "Funcionarios podem gerenciar agendamentos" ON public.agendamento;
CREATE POLICY "Permitir acesso total anonimo agendamento" 
ON public.agendamento 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Aplicação
DROP POLICY IF EXISTS "Funcionarios podem gerenciar aplicacoes" ON public.aplicacao;
CREATE POLICY "Permitir acesso total anonimo aplicacao" 
ON public.aplicacao 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);

-- Histórico
DROP POLICY IF EXISTS "Funcionarios podem visualizar historico" ON public.historico_aplicacoes_cliente;
CREATE POLICY "Permitir acesso total anonimo historico" 
ON public.historico_aplicacoes_cliente 
FOR ALL 
TO anon, authenticated
USING (true) 
WITH CHECK (true);