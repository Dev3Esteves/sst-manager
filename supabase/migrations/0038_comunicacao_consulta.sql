-- ============================================================================
-- MIGRATION 0038 — COMUNICAÇÃO E CONSULTA/PARTICIPAÇÃO (ISO 45001 7.4/5.4) — Fase D
-- Registro de comunicações (internas/externas) e de eventos de consulta e
-- participação dos trabalhadores. Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS registro_comunicacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'comunicacao_interna' CHECK (tipo IN ('consulta_participacao', 'comunicacao_interna', 'comunicacao_externa')),
  assunto TEXT NOT NULL,
  descricao TEXT,
  publico_alvo TEXT,            -- quem (trabalhadores, CIPA, órgão, cliente...)
  canal TEXT,                   -- reunião, e-mail, mural, DDS, ofício...
  responsavel_nome TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_registro_comunicacao_empresa ON registro_comunicacao(empresa_id);

ALTER TABLE registro_comunicacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "registro_comunicacao_select" ON registro_comunicacao;
CREATE POLICY "registro_comunicacao_select" ON registro_comunicacao
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "registro_comunicacao_write" ON registro_comunicacao;
CREATE POLICY "registro_comunicacao_write" ON registro_comunicacao
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria', 'encarregado_campo'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria', 'encarregado_campo'));
