UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email IN ('delmondesadv@gmail.com', 'example@email.com');

UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN ('delmondesadv@gmail.com', 'example@email.com');
