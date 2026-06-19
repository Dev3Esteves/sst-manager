-- ============================================================================
-- MIGRATION 0020 — MULTI-EMPRESA POR USUÁRIO + EMPRESA ATIVA
-- Permite que um usuário (ex.: operador de um grupo) opere mais de uma
-- empresa do grupo e alterne a "empresa ativa". Toda a navegação e o
-- RLS passam a respeitar a empresa ativa porque user_empresa_id() — usada por
-- todas as policies — passa a retornar a empresa ativa do usuário.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Vínculo usuário ↔ empresas (quais empresas o usuário pode operar)
-- ----------------------------------------------------------------------------
CREATE TABLE usuario_empresas (
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (usuario_id, empresa_id)
);
CREATE INDEX idx_usuario_empresas_usuario ON usuario_empresas(usuario_id);
CREATE INDEX idx_usuario_empresas_empresa ON usuario_empresas(empresa_id);

-- ----------------------------------------------------------------------------
-- 2. Empresa ativa selecionada pelo usuário (null = usa a empresa-empregadora)
-- ----------------------------------------------------------------------------
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS empresa_ativa_id UUID REFERENCES empresas(id);

-- ----------------------------------------------------------------------------
-- 3. Backfill: cada usuário atual passa a ter sua empresa como única permitida
--    e como empresa ativa (comportamento idêntico ao de hoje).
-- ----------------------------------------------------------------------------
INSERT INTO usuario_empresas (usuario_id, empresa_id)
SELECT id, empresa_id FROM usuarios
WHERE empresa_id IS NOT NULL
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

UPDATE usuarios
SET empresa_ativa_id = empresa_id
WHERE empresa_ativa_id IS NULL AND empresa_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 4. user_empresa_id() agora retorna a empresa ATIVA (com fallback p/ a
--    empresa-empregadora). Uma única mudança → todas as policies seguem.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION user_empresa_id()
RETURNS UUID AS $$
  SELECT COALESCE(empresa_ativa_id, empresa_id)
  FROM usuarios
  WHERE id = auth.uid() AND ativo = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5. RLS da tabela de vínculo
--    Usuário lê os próprios vínculos; admin gerencia.
-- ----------------------------------------------------------------------------
ALTER TABLE usuario_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_empresas_select_own" ON usuario_empresas
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR user_perfil_nome() = 'admin');

CREATE POLICY "usuario_empresas_admin_all" ON usuario_empresas
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- 6. Permite ao usuário LER os dados básicos de TODAS as empresas que pode
--    operar (não só a ativa) — necessário para alimentar o seletor de empresa.
--    A policy existente "empresas_select" só libera a empresa ativa/admin.
-- ----------------------------------------------------------------------------
CREATE POLICY "empresas_select_membership" ON empresas
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT empresa_id FROM usuario_empresas WHERE usuario_id = auth.uid())
  );
