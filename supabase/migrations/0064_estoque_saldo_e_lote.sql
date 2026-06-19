-- ============================================================================
-- MIGRATION 0064 — Estoque de EPIs: saldo (custo médio) + camadas de lote (FEFO)
-- ============================================================================
-- Saldo agregado por (empresa, epi, local) com custo médio ponderado.
-- Camadas de lote carregam validade do PRODUTO (distinta da validade do CA)
-- para consumo FEFO e alertas de vencimento de estoque.

CREATE TABLE estoque_saldo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  epi_id UUID NOT NULL REFERENCES epis(id) ON DELETE RESTRICT,
  local_id UUID NOT NULL REFERENCES estoque_local(id) ON DELETE RESTRICT,
  quantidade NUMERIC(14,3) NOT NULL DEFAULT 0,
  custo_medio NUMERIC(14,4) NOT NULL DEFAULT 0,
  custo_total NUMERIC(16,4) NOT NULL DEFAULT 0,
  reservado NUMERIC(14,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_estoque_saldo UNIQUE (empresa_id, epi_id, local_id),
  CONSTRAINT chk_saldo_nao_neg CHECK (quantidade >= 0)
);
CREATE INDEX idx_estoque_saldo_epi ON estoque_saldo(empresa_id, epi_id);
CREATE INDEX idx_estoque_saldo_local ON estoque_saldo(local_id);

COMMENT ON TABLE estoque_saldo IS 'Saldo agregado por (empresa, EPI, local) com custo médio ponderado. Mutado apenas pelas RPCs de movimentação.';

CREATE TABLE estoque_lote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  epi_id UUID NOT NULL REFERENCES epis(id) ON DELETE RESTRICT,
  local_id UUID NOT NULL REFERENCES estoque_local(id) ON DELETE RESTRICT,
  lote TEXT,
  fabricacao DATE,
  validade DATE,
  saldo NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  custo_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_estoque_lote_fefo ON estoque_lote(empresa_id, epi_id, local_id, validade NULLS LAST) WHERE saldo > 0;
CREATE INDEX idx_estoque_lote_validade ON estoque_lote(empresa_id, validade) WHERE saldo > 0;

COMMENT ON TABLE estoque_lote IS 'Camadas de lote por (EPI, local) com validade do produto (FEFO). Mutado apenas pelas RPCs.';

ALTER TABLE estoque_saldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_lote ENABLE ROW LEVEL SECURITY;

-- Operação (entrada/saída/etc.) inclui encarregado_campo (que faz entregas).
CREATE POLICY "estoque_saldo_select" ON estoque_saldo FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "estoque_saldo_write" ON estoque_saldo FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg','encarregado_campo'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg','encarregado_campo'));

CREATE POLICY "estoque_lote_select" ON estoque_lote FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "estoque_lote_write" ON estoque_lote FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg','encarregado_campo'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg','encarregado_campo'));
