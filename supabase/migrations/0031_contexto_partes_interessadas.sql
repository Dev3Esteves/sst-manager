-- ============================================================================
-- MIGRATION 0031 — CONTEXTO E PARTES INTERESSADAS (ISO 45001 4.1/4.2) — Fase B.1
--   • contexto_questao: questões internas/externas relevantes ao SGSST (4.1)
--   • parte_interessada: partes interessadas + necessidades/requisitos (4.2)
-- Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS contexto_questao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('interna', 'externa')),
  descricao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contexto_questao_empresa ON contexto_questao(empresa_id);

CREATE TABLE IF NOT EXISTS parte_interessada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'externa' CHECK (tipo IN ('interna', 'externa')),
  necessidades TEXT,
  requisitos TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_parte_interessada_empresa ON parte_interessada(empresa_id);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['contexto_questao', 'parte_interessada'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON %1$s', t);
    EXECUTE format($f$CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin')$f$, t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_write" ON %1$s', t);
    EXECUTE format($f$CREATE POLICY "%1$s_write" ON %1$s FOR ALL TO authenticated USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','engenheiro_seg','tec_seguranca','gestor_diretoria')) WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','engenheiro_seg','tec_seguranca','gestor_diretoria'))$f$, t);
  END LOOP;
END $$;
