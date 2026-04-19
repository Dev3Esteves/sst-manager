-- ============================================================================
-- MIGRATION 0009 — Hierarquia de empresas (multi-tenant) + entidade Obra
-- ============================================================================
-- Motivação:
--   1) O sistema precisa suportar várias empresas "donas" (multi-tenant real).
--      Hoje `empresas.tipo` (propria|contratante|terceira) não deixa claro quem
--      é dona x prestadora. Adicionamos `dona_sistema` (boolean) e
--      `empresa_mae_id` (FK) para modelar a relação explicitamente.
--   2) Os PDFs oficiais (NR-01 e Ficha de EPI) exigem o campo "Obra" no
--      cabeçalho. Promovemos "obra" a entidade de primeira classe para
--      permitir filtros, relatórios e emissão de documentos por obra.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Empresas — hierarquia
-- ----------------------------------------------------------------------------
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS dona_sistema BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS empresa_mae_id UUID REFERENCES empresas(id);

CREATE INDEX IF NOT EXISTS idx_empresas_dona ON empresas(dona_sistema) WHERE dona_sistema = true;
CREATE INDEX IF NOT EXISTS idx_empresas_mae ON empresas(empresa_mae_id);

-- Backfill: empresas 'propria' existentes viram donas automaticamente.
-- Usuários administradores podem ajustar depois pela UI.
UPDATE empresas SET dona_sistema = true WHERE tipo = 'propria' AND dona_sistema = false;

COMMENT ON COLUMN empresas.dona_sistema IS
  'Identifica empresas que são "donas do sistema" (multi-tenant). Podem ter '
  'suas próprias prestadoras/contratantes vinculadas via empresa_mae_id.';

COMMENT ON COLUMN empresas.empresa_mae_id IS
  'Empresa dona a que esta empresa está vinculada. Null quando é dona ou '
  'quando relacionamento ainda não foi mapeado.';

-- ----------------------------------------------------------------------------
-- 2. Obras — nova entidade
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  contratante_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  cidade TEXT,
  uf CHAR(2),
  data_inicio DATE,
  data_fim DATE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_empresa ON obras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_obras_contratante ON obras(contratante_id);
CREATE INDEX IF NOT EXISTS idx_obras_ativa ON obras(ativa) WHERE ativa = true;

COMMENT ON TABLE obras IS
  'Obras/projetos em andamento. Referência no cabeçalho de documentos '
  '(OS NR-01, Ficha de EPI, APR, PT, etc.) e para alocação de colaboradores.';

CREATE TRIGGER trg_obras_updated
  BEFORE UPDATE ON obras
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. FKs de obra em colaboradores e documentos
-- ----------------------------------------------------------------------------
ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS obra_id UUID REFERENCES obras(id) ON DELETE SET NULL;

ALTER TABLE documentos_sst
  ADD COLUMN IF NOT EXISTS obra_id UUID REFERENCES obras(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_colaboradores_obra ON colaboradores(obra_id);
CREATE INDEX IF NOT EXISTS idx_docs_obra ON documentos_sst(obra_id);

-- ----------------------------------------------------------------------------
-- 4. RLS de obras
-- ----------------------------------------------------------------------------
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obras_select" ON obras
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

CREATE POLICY "obras_write" ON obras
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg')
  );

-- ----------------------------------------------------------------------------
-- 5. Novo tipo de documento: os_nr01 (Ordem de Serviço NR-01 por função)
--    ficha_epi_cumulativa é gerada on-the-fly a partir das entregas, não é
--    persistida em documentos_sst — portanto só adicionamos os_nr01 aqui.
-- ----------------------------------------------------------------------------
ALTER TABLE documentos_sst DROP CONSTRAINT IF EXISTS documentos_sst_tipo_check;
ALTER TABLE documentos_sst ADD CONSTRAINT documentos_sst_tipo_check
  CHECK (tipo IN (
    'apr', 'pt', 'autorizacao_nr10', 'autorizacao_nr35',
    'autorizacao_nr33', 'pet', 'ait', 'os_seguranca',
    'dialogo_seguranca', 'checklist', 'relatorio_inspecao',
    'os_nr01'
  ));
