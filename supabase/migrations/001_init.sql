-- ============================================================
-- Sistema de Gestão Escolar — Schema Inicial
-- Migration: 001_init.sql
-- Criado em: 2026-06-03
-- Descrição: Schema completo (tabelas, triggers, RLS, índices)
-- ============================================================


-- ============================================================
-- FUNÇÃO AUXILIAR: atualiza coluna atualizado_em no UPDATE
-- ============================================================

CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;




-- ============================================================
-- TABELA: profiles
-- Perfis de acesso. Criado automaticamente pelo trigger
-- handle_new_user (gerado pelo Supabase Auth) ou manualmente.
-- Vinculado 1:1 a auth.users.
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  role          TEXT        NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: atualiza atualizado_em
CREATE TRIGGER trg_profiles_atualizado_em
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Função get_my_role() criada APÓS profiles (referencia esta tabela)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (id = auth.uid() OR get_my_role() = 'admin');


-- ============================================================
-- TABELA: professores
-- Cadastro completo dos professores.
-- ============================================================

CREATE TABLE IF NOT EXISTS professores (
  id            UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT        NOT NULL,
  email         TEXT        UNIQUE,
  telefone      TEXT,
  especialidade TEXT,
  documento     TEXT,
  endereco      TEXT,
  observacoes   TEXT,
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: atualiza atualizado_em
CREATE TRIGGER trg_professores_atualizado_em
  BEFORE UPDATE ON professores
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Índices
CREATE INDEX IF NOT EXISTS idx_professores_ativo ON professores (ativo);

-- RLS
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;

CREATE POLICY professores_select ON professores
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY professores_write ON professores
  FOR ALL
  USING (get_my_role() IN ('admin', 'editor'));


-- ============================================================
-- TABELA: aulas
-- Registro de aulas ao vivo. Depende de professores.
-- ============================================================

CREATE TABLE IF NOT EXISTS aulas (
  id                 UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id       UUID        REFERENCES professores(id) ON DELETE SET NULL,
  titulo             TEXT        NOT NULL,
  descricao          TEXT,
  data_hora          TIMESTAMPTZ NOT NULL,
  duracao_minutos    INTEGER     NOT NULL DEFAULT 60,
  link_transmissao   TEXT,
  status             TEXT        NOT NULL DEFAULT 'agendada'
                                 CHECK (status IN ('agendada', 'realizada', 'cancelada')),
  gravacao_url       TEXT,
  observacoes        TEXT,
  criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: atualiza atualizado_em
CREATE TRIGGER trg_aulas_atualizado_em
  BEFORE UPDATE ON aulas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Índices
CREATE INDEX IF NOT EXISTS idx_aulas_professor ON aulas (professor_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data     ON aulas (data_hora);
CREATE INDEX IF NOT EXISTS idx_aulas_status   ON aulas (status);

-- RLS
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY aulas_select ON aulas
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY aulas_write ON aulas
  FOR ALL
  USING (get_my_role() IN ('admin', 'editor'));


-- ============================================================
-- TABELA: pagamentos
-- Controle financeiro de pagamentos a professores.
-- ============================================================

CREATE TABLE IF NOT EXISTS pagamentos (
  id               UUID           NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id     UUID           REFERENCES professores(id) ON DELETE SET NULL,
  aula_id          UUID           REFERENCES aulas(id) ON DELETE SET NULL,
  descricao        TEXT           NOT NULL,
  valor            NUMERIC(10,2)  NOT NULL,
  data_vencimento  DATE           NOT NULL,
  data_pagamento   DATE,
  status           TEXT           NOT NULL DEFAULT 'pendente'
                                  CHECK (status IN ('pendente', 'pago', 'cancelado')),
  metodo           TEXT           CHECK (metodo IN ('pix', 'transferencia', 'dinheiro', 'outro')),
  comprovante_url  TEXT,
  observacoes      TEXT,
  criado_em        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Trigger: atualiza atualizado_em
CREATE TRIGGER trg_pagamentos_atualizado_em
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos (status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_venc   ON pagamentos (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_prof   ON pagamentos (professor_id);

-- RLS
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pagamentos_select ON pagamentos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY pagamentos_write ON pagamentos
  FOR ALL
  USING (get_my_role() IN ('admin', 'editor'));


-- ============================================================
-- TABELA: pessoal
-- Dados internos da equipe. Acesso exclusivo para admin.
-- CONFIDENCIAL: campo salario nunca deve aparecer em listagens.
-- ============================================================

CREATE TABLE IF NOT EXISTS pessoal (
  id              UUID           NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT           NOT NULL,
  cargo           TEXT,
  email           TEXT,
  telefone        TEXT,
  documento       TEXT,
  salario         NUMERIC(10,2),  -- CONFIDENCIAL: nunca exibir em listagens ou exportar em CSV
  data_admissao   DATE,
  data_demissao   DATE,
  status          TEXT           NOT NULL DEFAULT 'ativo'
                                 CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado')),
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Trigger: atualiza atualizado_em
CREATE TRIGGER trg_pessoal_atualizado_em
  BEFORE UPDATE ON pessoal
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- RLS
ALTER TABLE pessoal ENABLE ROW LEVEL SECURITY;

CREATE POLICY pessoal_admin_only ON pessoal
  FOR ALL
  USING (get_my_role() = 'admin');


-- ============================================================
-- TRIGGER: cria profile automaticamente ao registrar usuário
-- Dispara após INSERT em auth.users.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'viewer'  -- role padrão; admin deve ser configurado manualmente via SQL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
