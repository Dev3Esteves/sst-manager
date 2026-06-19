-- ============================================================================
-- MIGRATION 0066 — Estoque de EPIs: compras (entrada com fornecedor + NF + custo)
-- ============================================================================
-- A confirmação da compra (status='confirmada') gera as movimentações de
-- entrada via RPC (migration 0068). Fornecedor = empresa do mesmo tenant com
-- papel 'fornecedor'.

CREATE TABLE compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  local_id UUID NOT NULL REFERENCES estoque_local(id) ON DELETE RESTRICT,
  nota_fiscal TEXT,
  data_compra DATE NOT NULL,
  valor_total NUMERIC(16,4),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','confirmada','cancelada')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_compra_empresa ON compra(empresa_id);
CREATE INDEX idx_compra_fornecedor ON compra(fornecedor_id);

CREATE TABLE compra_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID NOT NULL REFERENCES compra(id) ON DELETE CASCADE,
  epi_id UUID NOT NULL REFERENCES epis(id) ON DELETE RESTRICT,
  lote TEXT,
  fabricacao DATE,
  validade DATE,
  quantidade NUMERIC(14,3) NOT NULL CHECK (quantidade > 0),
  custo_unitario NUMERIC(14,4) NOT NULL CHECK (custo_unitario >= 0)
);
CREATE INDEX idx_compra_item_compra ON compra_item(compra_id);

COMMENT ON TABLE compra IS 'Compra de EPIs (cabeçalho). A confirmação gera as entradas de estoque (RPC).';

ALTER TABLE compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE compra_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compra_select" ON compra FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "compra_write" ON compra FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg'));

-- compra_item: escopo herdado da compra-mãe (mesma empresa).
CREATE POLICY "compra_item_select" ON compra_item FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM compra c WHERE c.id = compra_id
                 AND (c.empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin')));
CREATE POLICY "compra_item_write" ON compra_item FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM compra c WHERE c.id = compra_id
                 AND c.empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg')))
  WITH CHECK (EXISTS (SELECT 1 FROM compra c WHERE c.id = compra_id
                 AND c.empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg')));
