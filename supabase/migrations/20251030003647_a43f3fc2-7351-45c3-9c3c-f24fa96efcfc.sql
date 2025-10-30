
-- Atualizar senha do admin para hash correto de "123456"
-- Hash bcrypt de "123456" com 10 rounds
UPDATE public.funcionario 
SET senha = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'admin@vixclinic.com';
