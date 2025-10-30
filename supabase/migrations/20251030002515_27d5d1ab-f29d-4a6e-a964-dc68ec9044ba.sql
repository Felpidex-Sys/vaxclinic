
-- Remover a constraint de tamanho de senha
-- O Supabase gerencia as senhas de forma segura, não precisamos validar na tabela funcionario
ALTER TABLE public.funcionario DROP CONSTRAINT IF EXISTS chk_funcionario_senha_tamanho;

-- Atualizar o trigger para inserir uma senha válida (hash fictício)
-- Usuários autenticados via Supabase não usam este campo
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Sempre inserir como admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin'::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;
  
  -- Sempre inserir funcionário como ADMIN com senha hash fictício
  INSERT INTO public.funcionario (
    user_id, email, nomecompleto, cpf, senha, cargo, status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '00000000000',
    '$2a$10$dummyhashforsupabaseauth1234567890', -- Hash fictício para autenticação Supabase
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
