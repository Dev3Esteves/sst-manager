-- ============================================================================
-- MIGRATION 0058 — Organização (conta/marca singleton, white-label)
-- ============================================================================
-- Introduz a "Organização": a conta dona desta instância (1 deploy por cliente).
-- Branding determinístico (nome, logo, template de certificado padrão) — substitui
-- a heurística "empresa dona_sistema mais antiga" do getMarca().

CREATE TABLE IF NOT EXISTS organizacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE CHECK (singleton = true),
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  logo_url TEXT,
  template_certificado TEXT,
  tema JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizacao IS
  'Conta/marca dona desta instância (white-label, singleton). Fonte determinística do branding: nome, logo e template de certificado padrão.';

DROP TRIGGER IF EXISTS trg_organizacao_updated ON organizacao;
CREATE TRIGGER trg_organizacao_updated BEFORE UPDATE ON organizacao
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE organizacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizacao_select" ON organizacao;
CREATE POLICY "organizacao_select" ON organizacao
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "organizacao_admin_all" ON organizacao;
CREATE POLICY "organizacao_admin_all" ON organizacao
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- Backfill: marca vem da empresa dona mais antiga (espelha o getMarca() atual).
INSERT INTO organizacao (nome, nome_fantasia, logo_url, template_certificado)
SELECT COALESCE(NULLIF(trim(e.nome_fantasia), ''), e.razao_social),
       NULLIF(trim(e.nome_fantasia), ''),
       e.logo_url,
       e.template_certificado
FROM empresas e
WHERE e.dona_sistema = true
ORDER BY e.created_at ASC
LIMIT 1
ON CONFLICT (singleton) DO NOTHING;

-- Fallback se não houver dona (instância recém-criada).
INSERT INTO organizacao (nome)
SELECT 'SST Manager'
WHERE NOT EXISTS (SELECT 1 FROM organizacao)
ON CONFLICT (singleton) DO NOTHING;
