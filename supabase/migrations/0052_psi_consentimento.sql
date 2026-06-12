-- ============================================================================
-- MIGRATION 0052 — Termo de consentimento: registro anônimo de recusas
-- ============================================================================
--
-- Antes de responder o questionário psicossocial, o respondente deve aceitar um
-- termo. Quem NÃO concorda tem a recusa registrada de forma ANÔNIMA (sem vínculo
-- com a pessoa), para análise posterior e para constar no relatório final
-- (contagem de recusas por campanha/GHE). Mesma postura de anonimato do
-- psi_resposta: RLS habilitada SEM policies → acesso só via service role no
-- servidor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS psi_recusa (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  campanha_id  UUID NOT NULL REFERENCES psi_campanha(id) ON DELETE CASCADE,
  pgr_ghe_id   UUID REFERENCES pgr_ghe(id) ON DELETE SET NULL,
  motivo       TEXT,                          -- opcional, livre e anônimo
  recusado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE psi_recusa IS
  'Recusa anônima ao termo de consentimento da pesquisa psicossocial. Sem FK para '
  'pessoa (NR-01 + LGPD). Inserção/leitura apenas via service role no servidor.';

CREATE INDEX idx_psi_recusa_campanha ON psi_recusa(campanha_id, pgr_ghe_id);

ALTER TABLE psi_recusa ENABLE ROW LEVEL SECURITY;
-- Sem policies: deny-all (apenas service role acessa), igual a psi_resposta.
