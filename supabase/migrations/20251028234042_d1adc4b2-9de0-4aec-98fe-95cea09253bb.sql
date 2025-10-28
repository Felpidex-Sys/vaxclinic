-- Atualizar todos os usuários existentes para admin
UPDATE public.user_roles SET role = 'admin'::app_role;

-- Atualizar todos os funcionários para ADMIN
UPDATE public.funcionario SET cargo = 'ADMIN';

-- Atualizar o trigger para sempre criar como admin
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Sempre inserir como admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin'::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;
  
  -- Sempre inserir funcionário como ADMIN
  INSERT INTO public.funcionario (
    user_id, email, nomecompleto, cpf, senha, cargo, status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '00000000000',
    '',
    'ADMIN',
    'ATIVO'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    nomecompleto = EXCLUDED.nomecompleto,
    cargo = 'ADMIN';
  
  RETURN NEW;
END;
$function$;

-- Remover as funções de promoção/demoção que não são mais necessárias
DROP FUNCTION IF EXISTS public.promote_user_to_admin(text);
DROP FUNCTION IF EXISTS public.demote_user_to_geral(text);
DROP FUNCTION IF EXISTS public.demote_user_to_funcionario(text);