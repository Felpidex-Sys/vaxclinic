-- Criar enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario');

-- Criar tabela de configuração do sistema
CREATE TABLE public.configuracao_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_clinica VARCHAR(255),
  setup_completo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir linha inicial de configuração (único registro)
INSERT INTO public.configuracao_sistema (setup_completo) VALUES (false);

-- Criar tabela de administradores
CREATE TABLE public.administradores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_clinica VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.configuracao_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para configuracao_sistema (todos podem ler para verificar setup)
CREATE POLICY "Permitir leitura configuracao_sistema"
ON public.configuracao_sistema FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem atualizar configuracao_sistema"
ON public.configuracao_sistema FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Políticas para administradores
CREATE POLICY "Permitir inserção de primeiro admin"
ON public.administradores FOR INSERT
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.configuracao_sistema WHERE setup_completo = true)
);

CREATE POLICY "Admins podem ver administradores"
ON public.administradores FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Políticas para user_roles
CREATE POLICY "Permitir inserção de role no primeiro setup"
ON public.user_roles FOR INSERT
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.configuracao_sistema WHERE setup_completo = true)
  OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Usuários podem ver seu próprio role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins podem ver todos os roles"
ON public.user_roles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Criar função de segurança para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Atualizar políticas do funcionario para excluir admins da visualização
DROP POLICY IF EXISTS "Permitir acesso total anonimo funcionario" ON public.funcionario;

CREATE POLICY "Admins podem gerenciar funcionarios"
ON public.funcionario FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));