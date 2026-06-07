-- ============================================================================
-- MIGRATION 0036 — PLANO DE EMERGÊNCIA (ISO 45001 8.2) — Fase C.3
-- Cenários de emergência com procedimento de resposta, recursos/brigada,
-- contatos, simulados e revisão periódica. Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS plano_emergencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id UUID REFERENCES obras(id),
  titulo TEXT NOT NULL,
  cenario TEXT NOT NULL CHECK (cenario IN ('incendio', 'vazamento', 'desabamento', 'choque_eletrico', 'primeiros_socorros', 'evacuacao', 'climatica', 'outro')),
  descricao TEXT,
  procedimento_resposta TEXT,
  recursos TEXT,                 -- brigada, extintores, kit, rotas
  brigada_responsavel TEXT,
  contatos_emergencia TEXT,      -- SAMU, bombeiros, brigada interna
  ultimo_simulado DATE,
  proximo_simulado DATE,
  licoes_aprendidas TEXT,
  data_revisao DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'em_revisao', 'inativo')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plano_emergencia_empresa ON plano_emergencia(empresa_id);

ALTER TABLE plano_emergencia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plano_emergencia_select" ON plano_emergencia;
CREATE POLICY "plano_emergencia_select" ON plano_emergencia
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "plano_emergencia_write" ON plano_emergencia;
CREATE POLICY "plano_emergencia_write" ON plano_emergencia
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'encarregado_campo'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'encarregado_campo'));
