-- ============================================================================
-- MIGRATION 0037 — AUDITORIA INTERNA (ISO 45001 9.2) — Fase C.4
-- Programa/execução de auditorias internas do SGSST + constatações (conformidade,
-- não-conformidade, observação, oportunidade). Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  numero_sequencial SERIAL,
  titulo TEXT NOT NULL,
  escopo TEXT,
  criterios TEXT,               -- ISO 45001, NRs, procedimentos internos
  auditor_nome TEXT,
  obra_id UUID REFERENCES obras(id),
  data_planejada DATE,
  data_realizacao DATE,
  conclusao TEXT,
  status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada', 'em_andamento', 'concluida', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria(empresa_id);

CREATE TABLE IF NOT EXISTS auditoria_constatacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  auditoria_id UUID NOT NULL REFERENCES auditoria(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'observacao' CHECK (tipo IN ('conformidade', 'nao_conformidade', 'observacao', 'oportunidade')),
  clausula TEXT,                -- cláusula/NR de referência
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_constatacao_aud ON auditoria_constatacao(auditoria_id);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['auditoria', 'auditoria_constatacao'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON %1$s', t);
    EXECUTE format($f$CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin')$f$, t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_write" ON %1$s', t);
    EXECUTE format($f$CREATE POLICY "%1$s_write" ON %1$s FOR ALL TO authenticated USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','engenheiro_seg','tec_seguranca','gestor_diretoria')) WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','engenheiro_seg','tec_seguranca','gestor_diretoria'))$f$, t);
  END LOOP;
END $$;
