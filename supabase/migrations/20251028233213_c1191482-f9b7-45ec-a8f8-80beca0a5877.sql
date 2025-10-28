-- Adicionar constraint única em user_id na tabela funcionario (se não existir)
ALTER TABLE public.funcionario 
DROP CONSTRAINT IF EXISTS funcionario_user_id_key;

ALTER TABLE public.funcionario 
ADD CONSTRAINT funcionario_user_id_key UNIQUE (user_id);

-- Recriar o trigger handle_new_user_role com a lógica correta
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
  ON CONFLICT (user_id, role) DO NOTHING;
  
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