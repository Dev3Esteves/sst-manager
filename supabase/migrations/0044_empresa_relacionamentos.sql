-- ============================================================================
-- MIGRATION 0044 — Parceiro de Negócio: RELACIONAMENTOS (Fase 1 / expand)
-- ============================================================================
-- Relacionamentos N:N entre empresas (origem -> destino, tipado). Generaliza
-- `empresas.empresa_mae_id` (mantido/deprecado nesta fase) e reflete a relação
-- `obras.contratante_id` (cliente_de). Aditiva e idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_relacionamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_origem_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  empresa_destino_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_relacao TEXT NOT NULL CHECK (tipo_relacao IN ('matriz_filial', 'cliente_de', 'fornecedor_de', 'prestadora_de', 'grupo')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT empresa_rel_origem_destino_diff CHECK (empresa_origem_id <> empresa_destino_id),
  UNIQUE (empresa_origem_id, empresa_destino_id, tipo_relacao)
);
CREATE INDEX IF NOT EXISTS idx_empresa_rel_origem ON empresa_relacionamentos(empresa_origem_id);
CREATE INDEX IF NOT EXISTS idx_empresa_rel_destino ON empresa_relacionamentos(empresa_destino_id);

COMMENT ON TABLE empresa_relacionamentos IS
  'Relacionamentos N:N entre empresas (Business Partner). Generaliza '
  'empresas.empresa_mae_id e reflete o contratante de obras.';

ALTER TABLE empresa_relacionamentos ENABLE ROW LEVEL SECURITY;

-- Relacionamento visível aos dois lados (ou admin); escrita admin-only.
DROP POLICY IF EXISTS "empresa_rel_select" ON empresa_relacionamentos;
CREATE POLICY "empresa_rel_select" ON empresa_relacionamentos
  FOR SELECT TO authenticated
  USING (
    empresa_origem_id = user_empresa_id()
    OR empresa_destino_id = user_empresa_id()
    OR user_perfil_nome() = 'admin'
  );

DROP POLICY IF EXISTS "empresa_rel_admin_all" ON empresa_relacionamentos;
CREATE POLICY "empresa_rel_admin_all" ON empresa_relacionamentos
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- Backfill (idempotente)
-- ----------------------------------------------------------------------------
-- 1) empresa_mae_id -> vínculo de grupo (origem = empresa; destino = mãe)
INSERT INTO empresa_relacionamentos (empresa_origem_id, empresa_destino_id, tipo_relacao)
SELECT id, empresa_mae_id, 'grupo'
FROM empresas
WHERE empresa_mae_id IS NOT NULL AND empresa_mae_id <> id
ON CONFLICT (empresa_origem_id, empresa_destino_id, tipo_relacao) DO NOTHING;

-- 2) contratante de obra -> cliente_de (origem = empresa dona; destino = contratante)
INSERT INTO empresa_relacionamentos (empresa_origem_id, empresa_destino_id, tipo_relacao)
SELECT DISTINCT empresa_id, contratante_id, 'cliente_de'
FROM obras
WHERE contratante_id IS NOT NULL AND contratante_id <> empresa_id
ON CONFLICT (empresa_origem_id, empresa_destino_id, tipo_relacao) DO NOTHING;
