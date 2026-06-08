-- ============================================================================
-- MIGRATION 0040 — Parceiro de Negócio: PAPÉIS (Fase 1 / expand)
-- ============================================================================
-- Substitui (sem remover) o `empresas.tipo` rígido por papéis N por empresa,
-- inspirado no Business Partner do SAP / accounts do Oracle TCA. Uma mesma
-- empresa pode ser cliente E prestadora ao mesmo tempo.
-- Aditiva e idempotente: NÃO altera `empresas`; `tipo` segue válido nesta fase.
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_papeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  papel TEXT NOT NULL CHECK (papel IN ('dona', 'cliente', 'prestadora', 'fornecedor', 'transportadora', 'parceira')),
  dados JSONB,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, papel)
);
CREATE INDEX IF NOT EXISTS idx_empresa_papeis_empresa ON empresa_papeis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_papeis_papel ON empresa_papeis(papel) WHERE ativo;

COMMENT ON TABLE empresa_papeis IS
  'Papéis de negócio de cada empresa (Business Partner). N papéis por empresa. '
  'Substitui o campo único empresas.tipo (deprecado na Fase 1).';

ALTER TABLE empresa_papeis ENABLE ROW LEVEL SECURITY;

-- Espelha as policies de `empresas`: leitura da empresa ativa (ou admin),
-- escrita admin-only (editar cadastro de empresa é admin-only no sistema).
DROP POLICY IF EXISTS "empresa_papeis_select" ON empresa_papeis;
CREATE POLICY "empresa_papeis_select" ON empresa_papeis
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "empresa_papeis_admin_all" ON empresa_papeis;
CREATE POLICY "empresa_papeis_admin_all" ON empresa_papeis
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- Backfill (idempotente)
-- ----------------------------------------------------------------------------
-- 1) tipo atual -> papel equivalente
INSERT INTO empresa_papeis (empresa_id, papel)
SELECT id, CASE tipo
             WHEN 'propria'     THEN 'dona'
             WHEN 'contratante' THEN 'cliente'
             WHEN 'terceira'    THEN 'prestadora'
           END
FROM empresas
WHERE tipo IN ('propria', 'contratante', 'terceira')
ON CONFLICT (empresa_id, papel) DO NOTHING;

-- 2) toda empresa marcada como dona do sistema também tem o papel 'dona'
INSERT INTO empresa_papeis (empresa_id, papel)
SELECT id, 'dona'
FROM empresas
WHERE dona_sistema = true
ON CONFLICT (empresa_id, papel) DO NOTHING;

-- 3) toda empresa usada como contratante de obra ganha o papel 'cliente'
INSERT INTO empresa_papeis (empresa_id, papel)
SELECT DISTINCT contratante_id, 'cliente'
FROM obras
WHERE contratante_id IS NOT NULL
ON CONFLICT (empresa_id, papel) DO NOTHING;
