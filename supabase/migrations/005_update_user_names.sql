-- Update for AndreSD
UPDATE auth.users 
SET raw_user_meta_data = '{"nome": "AndreSD", "name": "AndreSD", "full_name": "AndreSD"}'::jsonb
WHERE email = 'delmondesadv@gmail.com';

UPDATE public.profiles 
SET nome = 'AndreSD' 
WHERE email = 'delmondesadv@gmail.com';

-- Update for Usuário de Teste
UPDATE auth.users 
SET raw_user_meta_data = '{"nome": "Antônio Soares", "name": "Antônio Soares", "full_name": "Usuário de Teste"}'::jsonb
WHERE email = '*20SistemaControle26#';

UPDATE public.profiles 
SET nome = 'Antônio Soares' 
WHERE email = '*20SistemaControle26#';