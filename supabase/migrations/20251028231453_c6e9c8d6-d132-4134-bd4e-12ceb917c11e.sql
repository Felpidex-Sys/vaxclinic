-- Remover 'funcionario' e adicionar 'geral' como tipo padrão
-- Salvar dados existentes
CREATE TEMP TABLE temp_user_roles_backup AS 
SELECT user_id, 
       CASE 
         WHEN role::text = 'admin' THEN 'admin'
         ELSE 'geral'
       END as role_text
FROM public.user_roles;

-- Dropar e recriar tudo
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Criar enum apenas com admin e geral
CREATE TYPE public.app_role AS ENUM ('admin', 'geral');

-- Recriar tabela user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'geral'::app_role,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recriar policies
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- Trigger
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at_trigger
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_user_roles_updated_at();

-- Restaurar dados
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role_text::app_role
FROM temp_user_roles_backup
ON CONFLICT (user_id, role) DO NOTHING;

-- Recriar funções auxiliares
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- Atualizar função handle_new_user_role para criar como 'geral'
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'geral'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO public.funcionario (
    user_id, email, nomecompleto, cpf, senha, cargo, status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '00000000000',
    '',
    'GERAL',
    'ATIVO'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Atualizar função promote para admin
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.funcionario WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', user_email;
  END IF;
  
  UPDATE public.funcionario SET cargo = 'ADMIN' WHERE user_id = v_user_id;
  
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin'::app_role);
END;
$$;

-- Atualizar função demote para geral
CREATE OR REPLACE FUNCTION public.demote_user_to_geral(user_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.funcionario WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', user_email;
  END IF;
  
  UPDATE public.funcionario SET cargo = 'GERAL' WHERE user_id = v_user_id;
  
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'geral'::app_role);
END;
$$;