-- Criar usuário admin no auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admvixclinic@gmail.com',
  crypt('12345678', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Criar role de admin para o usuário
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admvixclinic@gmail.com';

-- Criar registro no funcionario
INSERT INTO public.funcionario (
  nomecompleto,
  cpf,
  email,
  cargo,
  senha,
  status,
  dataadmissao,
  user_id
)
SELECT 
  'Administrador VixClinic',
  '33672436792',
  'admvixclinic@gmail.com',
  'Administrador',
  crypt('12345678', gen_salt('bf')),
  'ATIVO'::funcionario_status,
  CURRENT_DATE,
  id
FROM auth.users
WHERE email = 'admvixclinic@gmail.com';