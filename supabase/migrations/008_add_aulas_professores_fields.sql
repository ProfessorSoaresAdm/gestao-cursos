-- Migration 002: Novos status e campos extras para aulas e professores

-- ============================================================
-- 1. TABELA aulas
-- ============================================================

-- 1.1. Remover o CHECK constraint antigo de status
ALTER TABLE aulas DROP CONSTRAINT IF EXISTS aulas_status_check;

-- 1.2. Adicionar novos valores de status preservando os existentes no projeto (agendada, realizada, cancelada, reagendada, em_andamento)
ALTER TABLE aulas ADD CONSTRAINT aulas_status_check
  CHECK (status IN (
    'agendada',
    'realizada',
    'cancelada',
    'reagendada',
    'em_andamento',
    'confirmada',
    'material_enviado',
    'material_postado',
    'aula_postada'
  ));

-- 1.3. Adicionar coluna monitor_id (FK para auth.users)
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS monitor_id UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1.4. Indice para queries de filtro por monitor
CREATE INDEX IF NOT EXISTS idx_aulas_monitor ON aulas (monitor_id);

-- ============================================================
-- 2. TABELA professores
-- ============================================================

-- 2.1. Instagram
ALTER TABLE professores ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

-- 2.2. Foto
ALTER TABLE professores ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2.3. PIX
ALTER TABLE professores ADD COLUMN IF NOT EXISTS pix_tipo TEXT
  CHECK (pix_tipo IN ('cpf','cnpj','email','telefone','aleatoria') OR pix_tipo IS NULL);
ALTER TABLE professores ADD COLUMN IF NOT EXISTS pix_chave TEXT;
