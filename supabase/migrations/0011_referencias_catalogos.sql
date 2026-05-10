-- ============================================================================
-- MIGRATION 0011 — CATÁLOGO DE REFERÊNCIAS (NRs)
-- Fonte primária: gov.br/trabalho-e-emprego — Normas Regulamentadoras NR-01 a NR-38
-- Tabela GLOBAL (sem empresa_id) — o catálogo é o mesmo para todos os tenants.
-- Leitura para qualquer authenticated; gravação somente via service_role
-- (executada pelo script scripts/seed-referencias-nr.mjs).
-- ============================================================================

CREATE TABLE nr_catalog (
  numero               text PRIMARY KEY,            -- '01', '02', ..., '38'
  titulo               text NOT NULL,
  status               text NOT NULL DEFAULT 'vigente'
                         CHECK (status IN ('vigente', 'revogada')),
  data_atualizacao     date,
  fonte_url            text NOT NULL,
  fonte_status         text NOT NULL DEFAULT 'ok'
                         CHECK (fonte_status IN ('ok', 'partial', 'error')),
  pdf_url              text,
  ementa               text,
  campo_aplicacao      text,
  portarias_recentes   jsonb NOT NULL DEFAULT '[]'::jsonb,
  manuais_relacionados jsonb NOT NULL DEFAULT '[]'::jsonb,
  notas                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE nr_catalog IS
  'Catálogo público de Normas Regulamentadoras brasileiras. Fonte: gov.br. Atualizado via scripts/seed-referencias-nr.mjs (idempotente, upsert por numero).';

CREATE INDEX nr_catalog_status_idx ON nr_catalog (status);

-- Reutiliza set_updated_at() já definida em 0002_triggers_views.sql
CREATE TRIGGER trg_nr_catalog_updated
  BEFORE UPDATE ON nr_catalog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- RLS — leitura authenticated; sem policies de escrita (service_role bypassa)
-- ============================================
ALTER TABLE nr_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nr_catalog_select" ON nr_catalog
  FOR SELECT TO authenticated
  USING (true);
