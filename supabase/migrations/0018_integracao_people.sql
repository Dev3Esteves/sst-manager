-- ============================================================================
-- MIGRATION 0018 — Integração com o "Sistenge People"
-- ============================================================================
--
-- O People passa a ser a FONTE DA VERDADE de cargos, colaboradores e exames.
-- Estes registros serão sincronizados para o SST (via webhook) e tratados como
-- somente-leitura na UI.
--
-- Esta migration é ADITIVA e segura para banco em produção:
--   - Adiciona `external_id` (id do registro no People) e `origem` em cada
--     tabela; registros já existentes ficam com origem='local'.
--   - Índice único parcial em (origem,external_id) evita duplicar o mesmo
--     registro do People, sem afetar os registros locais (external_id NULL).
--   - Tabela `integr_evento` garante idempotência do webhook (cada evento do
--     People é processado uma única vez).
-- ============================================================================

-- ---------- external_id + origem nas entidades sincronizadas ----------
ALTER TABLE cargos
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'local'
    CHECK (origem IN ('local', 'people'));

ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'local'
    CHECK (origem IN ('local', 'people'));

ALTER TABLE exames_medicos
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'local'
    CHECK (origem IN ('local', 'people'));

-- Um external_id do People é único por entidade (não afeta registros locais).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cargos_external
  ON cargos (external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_colaboradores_external
  ON colaboradores (external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_exames_external
  ON exames_medicos (external_id) WHERE external_id IS NOT NULL;

-- ---------- Idempotência dos eventos recebidos do People ----------
CREATE TABLE IF NOT EXISTS integr_evento (
  event_id      TEXT PRIMARY KEY,            -- id do evento no People (idempotency key)
  tipo          TEXT NOT NULL,               -- ex.: colaborador.upserted
  recebido_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'processado'
                  CHECK (status IN ('processado', 'erro')),
  detalhe       TEXT
);

CREATE INDEX IF NOT EXISTS idx_integr_evento_recebido ON integr_evento (recebido_em DESC);

-- RLS: a tabela de eventos é acessada apenas via service role (webhook). Sem
-- policies = sem acesso para authenticated/anon.
ALTER TABLE integr_evento ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE integr_evento IS
  'Log/idempotência dos eventos recebidos do Sistenge People via webhook. '
  'Acesso somente via service role.';
COMMENT ON COLUMN cargos.origem IS
  'local = cadastrado no SST; people = sincronizado do Sistenge People (read-only na UI).';
