DO $$
DECLARE
  andre_id UUID := gen_random_uuid();
  test_id UUID := gen_random_uuid();
BEGIN
  -- Verifica se a extensão pgcrypto está ativa
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  -- User 1: AndreSD
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'delmondesadv@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      andre_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'delmondesadv@gmail.com', extensions.crypt('px#UDA^fy&gNv5', extensions.gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nome":"AndreSD"}', NOW(), NOW()
    );
  END IF;

  -- User 2: Usuário de Teste
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'example@email.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      test_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'example@email.com', extensions.crypt('*20SistemaControle26#', extensions.gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nome":"Usuário de Teste"}', NOW(), NOW()
    );
  END IF;

  -- Update suas roles para admin (a trigger já criou as linhas em profiles)
  UPDATE profiles SET role = 'admin' WHERE email IN ('delmondesadv@gmail.com', 'example@email.com');
END
$$;
