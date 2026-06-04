-- Migration 007: Adicionando controle granular de telas por usuário
-- Modifica a tabela profiles para incluir o array de permissões

ALTER TABLE public.profiles 
ADD COLUMN telas_acesso TEXT[] DEFAULT '{"dashboard", "aulas", "pagamentos", "professores"}'::text[];

-- Atualizar o comentário na tabela
COMMENT ON COLUMN public.profiles.telas_acesso IS 'Array de telas que o usuário tem permissão para acessar.';
