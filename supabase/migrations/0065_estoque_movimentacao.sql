-- ============================================================================
-- MIGRATION 0065 — Estoque de EPIs: movimentação (KARDEX, append-only)
-- ============================================================================
-- Histórico imutável de todas as movimentações. Inserido apenas pelas RPCs.
-- Sem policy de UPDATE/DELETE (append-only).

CREATE TABLE estoque_movimentacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','transferencia','ajuste','perda','devolucao')),
  epi_id UUID NOT NULL REFERENCES epis(id) ON DELETE RESTRICT,
  local_id UUID NOT NULL REFERENCES estoque_local(id) ON DELETE RESTRICT,
  local_destino_id UUID REFERENCES estoque_local(id) ON DELETE RESTRICT,
  lote_id UUID REFERENCES estoque_lote(id) ON DELETE RESTRICT,
  quantidade NUMERIC(14,3) NOT NULL CHECK (quantidade > 0),
  custo_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
  custo_total NUMERIC(16,4) NOT NULL DEFAULT 0,
  saldo_apos NUMERIC(14,3) NOT NULL,
  custo_medio_apos NUMERIC(14,4) NOT NULL DEFAULT 0,
  origem TEXT NOT NULL CHECK (origem IN ('compra','entrega','devolucao','transferencia','inventario','manual')),
  ref_tabela TEXT,
  ref_id UUID,
  usuario_id UUID DEFAULT auth.uid(),
  observacao TEXT,
  data DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_estoque_mov_epi_data ON estoque_movimentacao(empresa_id, epi_id, data);
CREATE INDEX idx_estoque_mov_local_data ON estoque_movimentacao(empresa_id, local_id, data);
CREATE INDEX idx_estoque_mov_ref ON estoque_movimentacao(ref_tabela, ref_id);

COMMENT ON TABLE estoque_movimentacao IS 'KARDEX append-only do estoque de EPIs. Inserido apenas pelas RPCs de movimentação; sem UPDATE/DELETE.';

ALTER TABLE estoque_movimentacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_mov_select" ON estoque_movimentacao FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "estoque_mov_insert" ON estoque_movimentacao FOR INSERT TO authenticated
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin','tec_seguranca','engenheiro_seg','encarregado_campo'));
