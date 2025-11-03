-- ============================================
-- CORREÇÃO DE SEGURANÇA COMPLETA
-- ============================================

-- 1. REMOVER POLÍTICAS INSEGURAS QUE PERMITEM ACESSO ANÔNIMO
DROP POLICY IF EXISTS "Permitir acesso total anonimo cliente" ON public.cliente;
DROP POLICY IF EXISTS "Permitir acesso total anonimo aplicacao" ON public.aplicacao;
DROP POLICY IF EXISTS "Permitir acesso total anonimo lote" ON public.lote;
DROP POLICY IF EXISTS "Permitir acesso total anonimo vacina" ON public.vacina;
DROP POLICY IF EXISTS "Permitir acesso total anonimo agendamento" ON public.agendamento;
DROP POLICY IF EXISTS "Permitir acesso total anonimo historico" ON public.historico_aplicacoes_cliente;

-- 2. CRIAR POLÍTICAS SEGURAS PARA TABELA FUNCIONARIO
-- Admins podem ver todos os funcionários
CREATE POLICY "Admins podem ver funcionarios"
ON public.funcionario
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem inserir funcionários
CREATE POLICY "Admins podem inserir funcionarios"
ON public.funcionario
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem atualizar funcionários
CREATE POLICY "Admins podem atualizar funcionarios"
ON public.funcionario
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem deletar funcionários
CREATE POLICY "Admins podem deletar funcionarios"
ON public.funcionario
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. CRIAR POLÍTICAS SEGURAS PARA TABELA CLIENTE
-- Apenas usuários autenticados podem ver clientes
CREATE POLICY "Usuarios autenticados podem ver clientes"
ON public.cliente
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem inserir clientes
CREATE POLICY "Usuarios autenticados podem inserir clientes"
ON public.cliente
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem atualizar clientes
CREATE POLICY "Usuarios autenticados podem atualizar clientes"
ON public.cliente
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem deletar clientes
CREATE POLICY "Usuarios autenticados podem deletar clientes"
ON public.cliente
FOR DELETE
USING (auth.role() = 'authenticated');

-- 4. CRIAR POLÍTICAS SEGURAS PARA TABELA APLICACAO
-- Apenas usuários autenticados podem ver aplicações
CREATE POLICY "Usuarios autenticados podem ver aplicacoes"
ON public.aplicacao
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem inserir aplicações
CREATE POLICY "Usuarios autenticados podem inserir aplicacoes"
ON public.aplicacao
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem atualizar aplicações
CREATE POLICY "Usuarios autenticados podem atualizar aplicacoes"
ON public.aplicacao
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem deletar aplicações
CREATE POLICY "Usuarios autenticados podem deletar aplicacoes"
ON public.aplicacao
FOR DELETE
USING (auth.role() = 'authenticated');

-- 5. CRIAR POLÍTICAS SEGURAS PARA TABELA LOTE
-- Apenas usuários autenticados podem ver lotes
CREATE POLICY "Usuarios autenticados podem ver lotes"
ON public.lote
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem inserir lotes
CREATE POLICY "Usuarios autenticados podem inserir lotes"
ON public.lote
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem atualizar lotes
CREATE POLICY "Usuarios autenticados podem atualizar lotes"
ON public.lote
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem deletar lotes
CREATE POLICY "Usuarios autenticados podem deletar lotes"
ON public.lote
FOR DELETE
USING (auth.role() = 'authenticated');

-- 6. CRIAR POLÍTICAS SEGURAS PARA TABELA VACINA
-- Apenas usuários autenticados podem ver vacinas
CREATE POLICY "Usuarios autenticados podem ver vacinas"
ON public.vacina
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem inserir vacinas
CREATE POLICY "Usuarios autenticados podem inserir vacinas"
ON public.vacina
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem atualizar vacinas
CREATE POLICY "Usuarios autenticados podem atualizar vacinas"
ON public.vacina
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem deletar vacinas
CREATE POLICY "Usuarios autenticados podem deletar vacinas"
ON public.vacina
FOR DELETE
USING (auth.role() = 'authenticated');

-- 7. CRIAR POLÍTICAS SEGURAS PARA TABELA AGENDAMENTO
-- Apenas usuários autenticados podem ver agendamentos
CREATE POLICY "Usuarios autenticados podem ver agendamentos"
ON public.agendamento
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem inserir agendamentos
CREATE POLICY "Usuarios autenticados podem inserir agendamentos"
ON public.agendamento
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem atualizar agendamentos
CREATE POLICY "Usuarios autenticados podem atualizar agendamentos"
ON public.agendamento
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem deletar agendamentos
CREATE POLICY "Usuarios autenticados podem deletar agendamentos"
ON public.agendamento
FOR DELETE
USING (auth.role() = 'authenticated');

-- 8. CRIAR POLÍTICAS SEGURAS PARA TABELA HISTORICO
-- Apenas usuários autenticados podem ver histórico
CREATE POLICY "Usuarios autenticados podem ver historico"
ON public.historico_aplicacoes_cliente
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem inserir no histórico
CREATE POLICY "Usuarios autenticados podem inserir historico"
ON public.historico_aplicacoes_cliente
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');