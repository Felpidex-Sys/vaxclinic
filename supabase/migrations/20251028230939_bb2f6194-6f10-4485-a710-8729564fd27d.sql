-- Garantir que o trigger de criação automática está funcionando corretamente
-- Quando criar usuário no Auth, automaticamente cria como funcionário

-- Recriar a função de handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insere role padrão 'funcionario' para todo novo usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Cria registro básico na tabela funcionario
  INSERT INTO public.funcionario (
    user_id,
    email,
    nomecompleto,
    cpf,
    senha,
    cargo,
    status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '00000000000', -- CPF placeholder
    '', -- Senha vazia pois usa auth
    'FUNCIONARIO',
    'ATIVO'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Criar função para promover usuário a admin
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar user_id do funcionário
  SELECT user_id INTO v_user_id
  FROM public.funcionario
  WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', user_email;
  END IF;
  
  -- Atualizar cargo em funcionario
  UPDATE public.funcionario
  SET cargo = 'ADMIN'
  WHERE user_id = v_user_id;
  
  -- Atualizar role em user_roles
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::app_role);
END;
$$;

-- Criar função para rebaixar usuário a funcionário
CREATE OR REPLACE FUNCTION public.demote_user_to_funcionario(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar user_id do funcionário
  SELECT user_id INTO v_user_id
  FROM public.funcionario
  WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', user_email;
  END IF;
  
  -- Atualizar cargo em funcionario
  UPDATE public.funcionario
  SET cargo = 'FUNCIONARIO'
  WHERE user_id = v_user_id;
  
  -- Atualizar role em user_roles
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'funcionario'::app_role);
END;
$$;