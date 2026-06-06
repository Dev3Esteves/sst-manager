-- ============================================================================
-- MIGRATION 0032 — ESCOPO DO SGSST (ISO 45001 4.3/4.4) — Fase B.2
-- Declaração documentada do escopo do sistema de gestão de SST (limites,
-- aplicabilidade e exclusões justificadas). Um registro por empresa.
-- ============================================================================

CREATE TABLE IF NOT EXISTS escopo_sgsst (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  exclusoes TEXT,
  aprovado_por_nome TEXT,
  data_aprovacao DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (empresa_id)
);

ALTER TABLE escopo_sgsst ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "escopo_sgsst_select" ON escopo_sgsst;
CREATE POLICY "escopo_sgsst_select" ON escopo_sgsst
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "escopo_sgsst_write" ON escopo_sgsst;
CREATE POLICY "escopo_sgsst_write" ON escopo_sgsst
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'));
