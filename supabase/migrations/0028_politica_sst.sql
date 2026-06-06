-- ============================================================================
-- MIGRATION 0028 — POLÍTICA DE SST (ISO 45001 cláusula 5.2) — Fase A.1
-- Documento de política versionado, com os compromissos exigidos pela 5.2,
-- aprovação pela direção, publicação e registro de ciência dos trabalhadores
-- (evidência de comunicação). Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS politica_sst (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  numero_revisao INTEGER NOT NULL DEFAULT 0,
  titulo TEXT NOT NULL DEFAULT 'Política de Segurança e Saúde no Trabalho',
  conteudo TEXT NOT NULL,
  -- Compromissos da cláusula 5.2 (auditor verifica que todos estão cobertos)
  compromisso_condicoes_seguras BOOLEAN NOT NULL DEFAULT true,
  compromisso_requisitos_legais BOOLEAN NOT NULL DEFAULT true,
  compromisso_eliminar_riscos BOOLEAN NOT NULL DEFAULT true,
  compromisso_melhoria_continua BOOLEAN NOT NULL DEFAULT true,
  compromisso_participacao BOOLEAN NOT NULL DEFAULT true,
  aprovado_por_nome TEXT,
  aprovado_por_cargo TEXT,
  data_aprovacao DATE,
  data_publicacao DATE,
  publica BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'vigente', 'substituida')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_politica_sst_empresa ON politica_sst(empresa_id);

ALTER TABLE politica_sst ENABLE ROW LEVEL SECURITY;
-- Leitura: todos os autenticados da empresa (precisam ler para dar ciência).
DROP POLICY IF EXISTS "politica_sst_select" ON politica_sst;
CREATE POLICY "politica_sst_select" ON politica_sst
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
-- Escrita: direção/segurança.
DROP POLICY IF EXISTS "politica_sst_write" ON politica_sst;
CREATE POLICY "politica_sst_write" ON politica_sst
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'));

-- Registro de ciência (comunicação a trabalhadores — evidência da 5.2/7.4)
CREATE TABLE IF NOT EXISTS politica_sst_ciencia (
  politica_id UUID NOT NULL REFERENCES politica_sst(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ciente_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (politica_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS idx_politica_ciencia_politica ON politica_sst_ciencia(politica_id);

ALTER TABLE politica_sst_ciencia ENABLE ROW LEVEL SECURITY;
-- Cada um lê a própria ciência; gestão lê todas (para contagem/auditoria).
DROP POLICY IF EXISTS "politica_ciencia_select" ON politica_sst_ciencia;
CREATE POLICY "politica_ciencia_select" ON politica_sst_ciencia
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'));
-- Cada um registra a própria ciência.
DROP POLICY IF EXISTS "politica_ciencia_write_own" ON politica_sst_ciencia;
CREATE POLICY "politica_ciencia_write_own" ON politica_sst_ciencia
  FOR ALL TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());
