-- Corrigir políticas RLS para evitar recursão infinita
-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Permitir inserção de role no primeiro setup" ON public.user_roles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem ver todos os roles" ON public.user_roles;

-- Criar novas políticas sem recursão
-- Permitir inserção apenas durante o setup inicial (quando não há nenhum registro em user_roles ainda)
CREATE POLICY "Permitir inserção de role no primeiro setup"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM configuracao_sistema WHERE setup_completo = true)
  );

-- Permitir que usuários vejam seu próprio role
CREATE POLICY "Usuários podem ver seu próprio role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Permitir que admins vejam todos os roles usando a função has_role
CREATE POLICY "Admins podem ver todos os roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Permitir que admins insiram novos roles usando a função has_role
CREATE POLICY "Admins podem inserir roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));