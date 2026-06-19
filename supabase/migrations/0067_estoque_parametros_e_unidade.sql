-- ============================================================================
-- MIGRATION 0067 — Estoque de EPIs: unidade no catálogo + parâmetros de controle
-- ============================================================================

-- Unidade de medida é propriedade do produto (catálogo global).
ALTER TABLE epis ADD COLUMN IF NOT EXISTS unidade TEXT NOT NULL DEFAULT 'un';

-- Parâmetros de controle por (empresa, epi[, local]). local_id NULL = vale p/ a empresa.
CREATE TABLE estoque_parametro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  epi_id UUID NOT NULL REFERENCES epis(id) ON DELETE CASCADE,
  local_id UUID REFERENCES estoque_local(id) ON DELETE CASCADE,
  estoque_minimo NUMERIC(14,3) NOT NULL DEFAULT 0,
  estoque_maximo NUMERIC(14,3),
  estoque_seguranca NUMERIC(14,3) NOT NULL DEFAULT 0,
  ponto_pedido NUMERIC(14,3),
  lead_time_dias INTEGER NOT NULL DEFAULT 0,
  consumo_medio NUMERIC(14,3) NOT NULL DEFAULT 0,
  curva_abc CHAR(1) CHECK (curva_abc IN ('A','B','C')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Unicidade por (empresa, epi, local) tratando NULL (parâmetro da empresa) distinto do por-local.
CREATE UNIQUE INDEX uq_parametro_empresa ON estoque_parametro(empresa_id, epi_id) WHERE local_id IS NULL;
CREATE UNIQUE INDEX uq_parametro_local ON estoque_parametro(empresa_id, epi_id, local_id) WHERE local_id IS NOT NULL;
CREATE INDEX idx_parametro_epi ON estoque_parametro(empresa_id, epi_id);

DROP TRIGGER IF EXISTS trg_estoque_parametro_updated ON estoque_parametro;
CREATE TRIGGER trg_estoque_parametro_updated BEFORE UPDATE ON estoque_parametro
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE estoque_parametro IS 'Parâmetros de controle de estoque (mín/máx/segurança/ponto de pedido/lead time/ABC) por EPI e (opcionalmente) local.';

ALTER TABLE estoque_parametro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_parametro_select" ON estoque_parametro FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "estoque_parametro_write" ON estoque_parametro FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg'));
