-- Corrige a chave estrangeira monitor_id da tabela aulas
-- para apontar corretamente para a tabela profiles,
-- permitindo que a API do Supabase (PostgREST) faça o JOIN corretamente.

ALTER TABLE public.aulas 
DROP CONSTRAINT IF EXISTS aulas_monitor_id_fkey;

ALTER TABLE public.aulas 
ADD CONSTRAINT aulas_monitor_id_fkey 
FOREIGN KEY (monitor_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Atualiza o cache do PostgREST para reconhecer o novo relacionamento imediatamente
NOTIFY pgrst, 'reload schema';
