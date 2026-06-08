-- ============================================================================
-- MIGRATION 0042 — Parceiro de Negócio: CONTATOS (Fase 1 / expand)
-- ============================================================================
-- Contatos 1:N (telefone/celular/email/pessoa) com no máximo 1 principal.
-- Backfill de `empresas.telefones->>'principal'`. Aditiva e idempotente:
-- não remove `empresas.telefones` (deprecado na Fase 1).
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('telefone', 'celular', 'email', 'pessoa')),
  valor TEXT,
  nome_contato TEXT,
  cargo_contato TEXT,
  principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_empresa_contatos_empresa ON empresa_contatos(empresa_id);

COMMENT ON TABLE empresa_contatos IS
  'Contatos de cada empresa (Business Partner), 1:N. Substitui o JSONB '
  'empresas.telefones (deprecado na Fase 1).';

CREATE TRIGGER trg_empresa_contatos_updated
  BEFORE UPDATE ON empresa_contatos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE empresa_contatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_contatos_select" ON empresa_contatos;
CREATE POLICY "empresa_contatos_select" ON empresa_contatos
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "empresa_contatos_admin_all" ON empresa_contatos;
CREATE POLICY "empresa_contatos_admin_all" ON empresa_contatos
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- Backfill (idempotente)
-- ----------------------------------------------------------------------------
INSERT INTO empresa_contatos (empresa_id, tipo, valor, principal)
SELECT e.id, 'telefone', e.telefones->>'principal', true
FROM empresas e
WHERE NULLIF(trim(e.telefones->>'principal'), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM empresa_contatos x WHERE x.empresa_id = e.id AND x.tipo = 'telefone'
  );
