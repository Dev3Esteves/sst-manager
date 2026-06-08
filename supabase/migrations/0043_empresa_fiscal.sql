-- ============================================================================
-- MIGRATION 0043 — Parceiro de Negócio: BLOCO FISCAL (Fase 1 / expand)
-- ============================================================================
-- Dados fiscais estruturados 1:1 com a empresa. Tabela separada (não colunas)
-- para manter `empresas` enxuta — é a tabela mais referenciada do sistema.
-- `inscricao_estadual` permanece em `empresas` nesta fase. Sem backfill (não há
-- dados de origem). Aditiva e idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_fiscal (
  empresa_id UUID PRIMARY KEY REFERENCES empresas(id) ON DELETE CASCADE,
  inscricao_municipal TEXT,
  cnae_principal VARCHAR(10),
  regime_tributario TEXT CHECK (regime_tributario IN ('simples', 'lucro_presumido', 'lucro_real', 'mei', 'isento')),
  situacao_cadastral TEXT CHECK (situacao_cadastral IN ('ativa', 'suspensa', 'inapta', 'baixada', 'nula')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE empresa_fiscal IS
  'Dados fiscais 1:1 da empresa (CNAE, regime tributário, inscrição municipal, '
  'situação cadastral). inscricao_estadual permanece em empresas na Fase 1.';

CREATE TRIGGER trg_empresa_fiscal_updated
  BEFORE UPDATE ON empresa_fiscal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE empresa_fiscal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_fiscal_select" ON empresa_fiscal;
CREATE POLICY "empresa_fiscal_select" ON empresa_fiscal
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "empresa_fiscal_admin_all" ON empresa_fiscal;
CREATE POLICY "empresa_fiscal_admin_all" ON empresa_fiscal
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');
