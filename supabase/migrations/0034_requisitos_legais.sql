-- ============================================================================
-- MIGRATION 0034 — REQUISITOS LEGAIS E OUTROS (ISO 45001 6.1.3 / 9.1.2) — Fase C.1
-- Registro dos requisitos legais (NRs e outros) aplicáveis e a avaliação do seu
-- atendimento. Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS requisito_legal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'nr' CHECK (tipo IN ('nr', 'lei', 'decreto', 'portaria', 'norma_tecnica', 'convencao', 'outro')),
  referencia TEXT NOT NULL,        -- ex.: "NR-35", "Lei 6.514/77"
  titulo TEXT,
  aplicabilidade TEXT,             -- onde/como se aplica na organização
  atende BOOLEAN,                  -- avaliação de atendimento (null = não avaliado)
  evidencia TEXT,                  -- como atende / evidência
  responsavel_nome TEXT,
  data_avaliacao DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_requisito_legal_empresa ON requisito_legal(empresa_id);

ALTER TABLE requisito_legal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "requisito_legal_select" ON requisito_legal;
CREATE POLICY "requisito_legal_select" ON requisito_legal
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "requisito_legal_write" ON requisito_legal;
CREATE POLICY "requisito_legal_write" ON requisito_legal
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'));
