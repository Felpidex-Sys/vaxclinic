-- Adicionar constraint única em user_id na tabela user_roles
-- Como cada usuário tem apenas UM role, usar unique em user_id é suficiente
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Atualizar o trigger para usar a constraint correta
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Inserir role na tabela user_roles (única por user_id)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'geral'::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  
  -- Inserir funcionário (única por user_id)
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
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    nomecompleto = EXCLUDED.nomecompleto;
  
  RETURN NEW;
END;
$function$;