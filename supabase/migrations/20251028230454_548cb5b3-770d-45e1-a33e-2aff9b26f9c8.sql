-- Atualizar permissões do admin@vixclinic para administrador

-- Primeiro, pegar o user_id desse funcionário
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar o user_id do funcionário com esse email
  SELECT user_id INTO v_user_id
  FROM public.funcionario
  WHERE email = 'admvixclinic@gmail.com';

  -- Se encontrou o user_id, atualizar as permissões
  IF v_user_id IS NOT NULL THEN
    -- Atualizar o cargo na tabela funcionario
    UPDATE public.funcionario
    SET cargo = 'ADMIN'
    WHERE email = 'admvixclinic@gmail.com';

    -- Deletar role existente e inserir como admin
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuário admvixclinic@gmail.com atualizado para administrador';
  ELSE
    RAISE NOTICE 'Usuário admvixclinic@gmail.com não encontrado ou não possui user_id vinculado';
  END IF;
END $$;