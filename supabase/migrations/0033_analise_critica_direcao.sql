-- ============================================================================
-- MIGRATION 0033 — ANÁLISE CRÍTICA PELA DIREÇÃO (ISO 45001 9.3) — Fase B.3
-- Registro das análises críticas do SGSST pela alta direção (entradas, conclusões
-- e decisões/saídas), em intervalos planejados. Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS analise_critica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  data_reuniao DATE NOT NULL,
  periodo TEXT,                 -- período de referência (ex.: "2026 — 1º semestre")
  participantes TEXT,
  -- Entradas (9.3)
  entradas_consideradas TEXT,   -- ações anteriores, mudanças de contexto, requisitos legais, etc.
  desempenho_resumo TEXT,       -- objetivos/indicadores, NCs, auditorias, incidentes, consulta
  -- Saídas (9.3)
  conclusoes TEXT,              -- adequação, suficiência e eficácia do SGSST
  decisoes TEXT,                -- melhoria contínua, mudanças, recursos, ações
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analise_critica_empresa ON analise_critica(empresa_id);

ALTER TABLE analise_critica ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analise_critica_select" ON analise_critica;
CREATE POLICY "analise_critica_select" ON analise_critica
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "analise_critica_write" ON analise_critica;
CREATE POLICY "analise_critica_write" ON analise_critica
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'));
