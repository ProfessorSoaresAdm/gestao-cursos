-- Update for AndreSD
UPDATE auth.users 
SET raw_user_meta_data = '{"nome": "AndreSD", "name": "AndreSD", "full_name": "AndreSD"}'::jsonb
WHERE email = 'delmondesadv@gmail.com';

UPDATE public.profiles 
SET nome = 'AndreSD' 
WHERE email = 'delmondesadv@gmail.com';

-- Update for Usuário de Teste
UPDATE auth.users 
SET raw_user_meta_data = '{"nome": "Usuário de Teste", "name": "Usuário de Teste", "full_name": "Usuário de Teste"}'::jsonb
WHERE email = 'example@email.com';

UPDATE public.profiles 
SET nome = 'Usuário de Teste' 
WHERE email = 'example@email.com';
