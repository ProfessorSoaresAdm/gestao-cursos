-- Tabela principal de entradas do changelog
CREATE TABLE IF NOT EXISTS changelogs (
  id          UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  versao      TEXT        NOT NULL,
  tipo        TEXT        NOT NULL
                CHECK (tipo IN ('feature','fix','melhoria','breaking','seguranca')),
  titulo      TEXT        NOT NULL,
  descricao   TEXT,
  autor       TEXT        NOT NULL DEFAULT 'sistema',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de controle de leitura por usuario
CREATE TABLE IF NOT EXISTS changelogs_lidos (
  changelog_id UUID NOT NULL REFERENCES changelogs(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lido_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (changelog_id, user_id)
);

-- Indice para busca de nao lidos por usuario
CREATE INDEX IF NOT EXISTS idx_changelogs_criado_em
  ON changelogs (criado_em DESC);

-- RLS
ALTER TABLE changelogs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelogs_lidos  ENABLE ROW LEVEL SECURITY;

-- Qualquer usuario autenticado pode ler o changelog
CREATE POLICY "Usuarios autenticados leem changelog"
  ON changelogs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas admin pode inserir/editar entradas do changelog
CREATE POLICY "Admin gerencia changelog"
  ON changelogs FOR ALL
  USING (get_my_role() = 'admin');

-- Cada usuario gerencia apenas suas proprias leituras
CREATE POLICY "Usuario gerencia proprias leituras"
  ON changelogs_lidos FOR ALL
  USING (auth.uid() = user_id);