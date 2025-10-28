-- 1) Função: ao criar usuário no Auth (Cloud -> Users), atribuir role padrão 'funcionario'
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- insere role padrão apenas se ainda não existir
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2) Trigger: executa após cada criação de usuário no Auth
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;
CREATE TRIGGER on_auth_user_created_set_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 3) Backfill: garante role para usuários existentes sem qualquer role
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'funcionario'::app_role
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id
);
