-- ============================================================================
-- MIGRATION 0054 — Pesquisa qualitativa psicossocial (perguntas abertas)
-- ============================================================================
--
-- Complementa o questionário quantitativo (Likert) com perguntas ABERTAS,
-- conforme a triangulação recomendada pela NR-01. Configurável por campanha:
--   • 'integrado'  → abertas antes do Likert, no mesmo link/QR anônimo;
--   • 'separado'   → campanha só-qualitativa (sem Likert);
--   • 'nenhum'     → comportamento atual (só quantitativo).
-- Respostas abertas são ANÔNIMAS (deny-all, igual psi_resposta). A síntese por
-- IA (temas) é cacheada em psi_sintese_qualitativa, com revisão p/ liberar verbatim.
-- ============================================================================

ALTER TABLE psi_campanha
  ADD COLUMN IF NOT EXISTS modo_qualitativo TEXT NOT NULL DEFAULT 'nenhum'
    CHECK (modo_qualitativo IN ('nenhum', 'integrado', 'separado')),
  ADD COLUMN IF NOT EXISTS perguntas_qualitativas JSONB;

COMMENT ON COLUMN psi_campanha.modo_qualitativo IS
  'nenhum | integrado (abertas + Likert no mesmo link) | separado (só abertas).';
COMMENT ON COLUMN psi_campanha.perguntas_qualitativas IS
  'Array JSON de perguntas abertas (texto). NULL = usar template padrão.';

-- ----------------------------------------------------------------------------
-- Respostas abertas (ANÔNIMAS) — sem FK para pessoa, igual psi_resposta
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS psi_resposta_qualitativa (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  campanha_id    UUID NOT NULL REFERENCES psi_campanha(id) ON DELETE CASCADE,
  pgr_ghe_id     UUID NOT NULL REFERENCES pgr_ghe(id) ON DELETE CASCADE,
  pergunta_idx   SMALLINT NOT NULL,
  pergunta_texto TEXT NOT NULL,
  resposta_texto TEXT NOT NULL,
  respondido_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_psi_resp_qual_campanha_ghe ON psi_resposta_qualitativa(campanha_id, pgr_ghe_id);

COMMENT ON TABLE psi_resposta_qualitativa IS
  'Resposta aberta anônima (NR-01 + LGPD). Sem FK a pessoa. Inserção/leitura apenas via service role.';

-- ----------------------------------------------------------------------------
-- Síntese por IA (cache + estado de revisão) — leitura por empresa, igual resultado
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS psi_sintese_qualitativa (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  campanha_id       UUID NOT NULL REFERENCES psi_campanha(id) ON DELETE CASCADE,
  pgr_ghe_id        UUID REFERENCES pgr_ghe(id) ON DELETE CASCADE,   -- NULL = visão global da campanha
  temas             JSONB NOT NULL DEFAULT '[]',
  alertas           JSONB NOT NULL DEFAULT '[]',
  sugestoes         JSONB NOT NULL DEFAULT '[]',
  verbatim_aprovado JSONB NOT NULL DEFAULT '[]',
  revisado          BOOLEAN NOT NULL DEFAULT false,
  gerado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, pgr_ghe_id)
);
CREATE INDEX IF NOT EXISTS idx_psi_sintese_campanha ON psi_sintese_qualitativa(campanha_id);

COMMENT ON TABLE psi_sintese_qualitativa IS
  'Síntese temática (IA) das respostas abertas por GHE. verbatim_aprovado/revisado liberam citações no relatório.';

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
ALTER TABLE psi_resposta_qualitativa ENABLE ROW LEVEL SECURITY;
-- Sem policies: deny-all (só service role), igual psi_resposta.

ALTER TABLE psi_sintese_qualitativa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psi_sintese_select" ON psi_sintese_qualitativa
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "psi_sintese_write" ON psi_sintese_qualitativa
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));
