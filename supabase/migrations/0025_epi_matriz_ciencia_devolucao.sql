-- ============================================================================
-- MIGRATION 0025 — EPIs NR-06 (F3.2)
--   • epi_cargo: matriz EPI×Cargo (EPIs obrigatórios por função)
--   • epi_entregas: termo de ciência + controle de devolução
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Matriz EPI × Cargo (multiempresa; cargo já tem empresa_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS epi_cargo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES cargos(id) ON DELETE CASCADE,
  epi_id UUID NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_epi_cargo_cargo ON epi_cargo(cargo_id);
CREATE INDEX IF NOT EXISTS idx_epi_cargo_empresa ON epi_cargo(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_epi_cargo ON epi_cargo(empresa_id, cargo_id, epi_id);

ALTER TABLE epi_cargo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "epi_cargo_select" ON epi_cargo;
CREATE POLICY "epi_cargo_select" ON epi_cargo
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "epi_cargo_write" ON epi_cargo;
CREATE POLICY "epi_cargo_write" ON epi_cargo
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'));

-- ----------------------------------------------------------------------------
-- 2. epi_entregas: termo de ciência (NR-6.6.1 c) + controle de devolução
-- ----------------------------------------------------------------------------
ALTER TABLE epi_entregas
  ADD COLUMN IF NOT EXISTS ciencia BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS devolvido BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_devolucao DATE;
