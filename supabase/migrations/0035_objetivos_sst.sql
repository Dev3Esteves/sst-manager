-- ============================================================================
-- MIGRATION 0035 — OBJETIVOS E METAS DE SST (ISO 45001 6.2) — Fase C.2
-- Objetivos de SST mensuráveis, coerentes com a política, com indicador, meta,
-- prazo, responsável e acompanhamento. Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS objetivo_sst (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  indicador TEXT,               -- como será medido
  meta TEXT,                    -- alvo (ex.: "TF < 5", "100% dos exames em dia")
  linha_base TEXT,              -- valor de partida
  valor_atual TEXT,             -- valor corrente
  prazo DATE,
  responsavel_nome TEXT,
  recursos TEXT,                -- recursos necessários
  status TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado', 'em_andamento', 'atingido', 'nao_atingido', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_objetivo_sst_empresa ON objetivo_sst(empresa_id);

ALTER TABLE objetivo_sst ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "objetivo_sst_select" ON objetivo_sst;
CREATE POLICY "objetivo_sst_select" ON objetivo_sst
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "objetivo_sst_write" ON objetivo_sst;
CREATE POLICY "objetivo_sst_write" ON objetivo_sst
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'));
