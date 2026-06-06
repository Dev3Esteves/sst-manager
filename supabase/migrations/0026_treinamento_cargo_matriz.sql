-- ============================================================================
-- MIGRATION 0026 — TREINAMENTOS (F3.3)
--   • treinamento_cargo: matriz função→treinamentos obrigatórios (explícita)
-- Complementa a Matriz de Treinamentos (que hoje infere por NR do cargo):
-- agora o gestor define explicitamente os treinamentos exigidos por cargo.
-- ============================================================================

CREATE TABLE IF NOT EXISTS treinamento_cargo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES cargos(id) ON DELETE CASCADE,
  treinamento_id UUID NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_treinamento_cargo_cargo ON treinamento_cargo(cargo_id);
CREATE INDEX IF NOT EXISTS idx_treinamento_cargo_empresa ON treinamento_cargo(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_treinamento_cargo ON treinamento_cargo(empresa_id, cargo_id, treinamento_id);

ALTER TABLE treinamento_cargo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treinamento_cargo_select" ON treinamento_cargo;
CREATE POLICY "treinamento_cargo_select" ON treinamento_cargo
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "treinamento_cargo_write" ON treinamento_cargo;
CREATE POLICY "treinamento_cargo_write" ON treinamento_cargo
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'));
