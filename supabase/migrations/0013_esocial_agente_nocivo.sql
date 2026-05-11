-- ============================================================================
-- MIGRATION 0013 — CATÁLOGO DE AGENTES NOCIVOS (Tabela 24 do eSocial)
--
-- Fonte primária: gov.br/esocial — Documentação Técnica, leiaute S-1.3
-- (https://www.gov.br/esocial/pt-br/documentacao-tecnica/tabelas).
-- Evento que consome: S-2240 (Condições Ambientais do Trabalho — Agentes Nocivos),
-- usado para PPP eletrônico e aposentadoria especial (Decreto 3.048/1999, Anexo IV).
--
-- Convenções de código (3 grupos XX.XX.XXX):
--   01.xx.xxx → Agentes químicos
--   02.xx.xxx → Agentes físicos
--   03.xx.xxx → Agentes biológicos
--   04.xx.xxx → Associação de agentes
--   05.01.001 → "Ausência de agente nocivo ou de atividades previstas no Anexo IV
--                do Decreto 3.048/1999" (placeholder para ergonômico/acidente/
--                psicossocial — eSocial não emite S-2240 para esses casos).
--
-- Tabela GLOBAL (sem empresa_id) — o catálogo é o mesmo para todos os tenants,
-- seguindo o padrão já estabelecido por `nr_catalog` (migration 0011).
-- ============================================================================

CREATE TABLE esocial_agente_nocivo (
  codigo                          TEXT PRIMARY KEY,           -- '02.01.001'
  descricao                       TEXT NOT NULL,
  grupo                           TEXT NOT NULL
                                    CHECK (grupo IN (
                                      'quimico', 'fisico', 'biologico',
                                      'associacao', 'ausencia'
                                    )),
  exige_aposentadoria_especial    BOOLEAN NOT NULL DEFAULT false,
  limite_tolerancia               TEXT,                       -- ex.: "85 dB(A) — NR-15 Anexo 1"
  observacao                      TEXT,
  fonte_url                       TEXT NOT NULL DEFAULT
                                    'https://www.gov.br/esocial/pt-br/documentacao-tecnica/tabelas',
  versao_leiaute                  TEXT NOT NULL DEFAULT 'S-1.3',
  ativo                           BOOLEAN NOT NULL DEFAULT true,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE esocial_agente_nocivo IS
  'Tabela 24 do eSocial — Códigos dos Agentes Nocivos para S-2240. '
  'Atualizada via scripts/seed-esocial-tabela24.mjs (idempotente, upsert por '
  'codigo). Validação no editor de risco alerta quando categoria do risco e '
  'grupo do código divergem.';

COMMENT ON COLUMN esocial_agente_nocivo.exige_aposentadoria_especial IS
  'Quando true, exposição habitual e permanente ao agente em condição prejudicial '
  'à saúde caracteriza atividade especial (Anexo IV Dec. 3.048/1999).';

CREATE INDEX esocial_agente_nocivo_grupo_idx ON esocial_agente_nocivo (grupo);
CREATE INDEX esocial_agente_nocivo_ativo_idx ON esocial_agente_nocivo (ativo) WHERE ativo = true;

-- Reutiliza set_updated_at() de 0002_triggers_views.sql
CREATE TRIGGER trg_esocial_agente_nocivo_updated
  BEFORE UPDATE ON esocial_agente_nocivo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- RLS — leitura pública (authenticated); escrita só via service_role (seed)
-- ============================================================================
ALTER TABLE esocial_agente_nocivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esocial_agente_nocivo_select" ON esocial_agente_nocivo
  FOR SELECT TO authenticated
  USING (true);
