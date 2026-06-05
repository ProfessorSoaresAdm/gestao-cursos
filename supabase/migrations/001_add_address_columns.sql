-- Migration: 001_add_address_columns
-- Description: Adiciona colunas de endereço à tabela de professores, índices e views calculadas

-- 1. Colunas de endereço em professores
ALTER TABLE professores
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS logradouro TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT;

-- 2. Índice em pessoal(status) para otimizar filtros
CREATE INDEX IF NOT EXISTS idx_pessoal_status ON pessoal (status);

-- 3. View de pagamentos para cálculo de status 'atrasado'
CREATE OR REPLACE VIEW pagamentos_com_status AS
SELECT 
  p.*,
  CASE 
    WHEN p.status = 'pendente' AND p.data_vencimento < CURRENT_DATE THEN 'atrasado'
    ELSE p.status
  END as status_calculado
FROM pagamentos p;
