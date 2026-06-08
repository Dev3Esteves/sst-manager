-- ============================================================================
-- MIGRATION 0041 — Parceiro de Negócio: ENDEREÇOS (Fase 1 / expand)
-- ============================================================================
-- Endereços 1:N tipados (sede/filial/cobranca/obra/entrega), no máximo 1
-- principal por empresa. Backfill do JSONB `empresas.endereco` como sede
-- principal. Aditiva e idempotente: não remove `empresas.endereco` (deprecado).
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'sede' CHECK (tipo IN ('sede', 'filial', 'cobranca', 'obra', 'entrega')),
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  municipio TEXT,
  uf CHAR(2),
  principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_empresa_enderecos_empresa ON empresa_enderecos(empresa_id);
-- No máximo um endereço principal por empresa.
CREATE UNIQUE INDEX IF NOT EXISTS uq_empresa_endereco_principal
  ON empresa_enderecos(empresa_id) WHERE principal;

COMMENT ON TABLE empresa_enderecos IS
  'Endereços de cada empresa (Business Partner), 1:N tipados. Substitui o JSONB '
  'empresas.endereco (deprecado na Fase 1).';

CREATE TRIGGER trg_empresa_enderecos_updated
  BEFORE UPDATE ON empresa_enderecos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE empresa_enderecos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_enderecos_select" ON empresa_enderecos;
CREATE POLICY "empresa_enderecos_select" ON empresa_enderecos
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "empresa_enderecos_admin_all" ON empresa_enderecos;
CREATE POLICY "empresa_enderecos_admin_all" ON empresa_enderecos
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- Backfill do JSONB empresas.endereco (idempotente via NOT EXISTS)
-- ----------------------------------------------------------------------------
INSERT INTO empresa_enderecos (empresa_id, tipo, cep, logradouro, numero, complemento, bairro, municipio, uf, principal)
SELECT e.id, 'sede',
       e.endereco->>'cep',
       e.endereco->>'logradouro',
       e.endereco->>'numero',
       e.endereco->>'complemento',
       e.endereco->>'bairro',
       e.endereco->>'municipio',
       NULLIF(left(e.endereco->>'uf', 2), ''),
       true
FROM empresas e
WHERE e.endereco IS NOT NULL
  AND COALESCE(e.endereco->>'cep', e.endereco->>'logradouro', e.endereco->>'municipio') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM empresa_enderecos x WHERE x.empresa_id = e.id AND x.tipo = 'sede'
  );
