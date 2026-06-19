-- ============================================================================
-- MIGRATION 0063 — Estoque de EPIs: locais (almoxarifado central / obra)
-- ============================================================================
-- Local de estoque: o almoxarifado central da empresa e/ou cada obra.
-- Base do controle multi-local (saldo por EPI x local).

CREATE TABLE estoque_local (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('central','obra')),
  obra_id UUID REFERENCES obras(id) ON DELETE RESTRICT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_local_obra CHECK ((tipo = 'obra') = (obra_id IS NOT NULL))
);
CREATE UNIQUE INDEX uq_estoque_local_obra ON estoque_local(empresa_id, obra_id) WHERE obra_id IS NOT NULL;
CREATE UNIQUE INDEX uq_estoque_local_central ON estoque_local(empresa_id) WHERE tipo = 'central';
CREATE INDEX idx_estoque_local_empresa ON estoque_local(empresa_id);

COMMENT ON TABLE estoque_local IS 'Local de estoque de EPIs: almoxarifado central (1 por empresa) e/ou por obra.';

ALTER TABLE estoque_local ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_local_select" ON estoque_local FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "estoque_local_write" ON estoque_local FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg'));
