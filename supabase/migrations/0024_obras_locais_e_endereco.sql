-- ============================================================================
-- MIGRATION 0024 — OBRAS COMO FONTE DE VERDADE (F3.1)
--   • Estende `obras` (CNPJ, endereço completo, empreitada total/parcial)
--   • Nova tabela `obra_locais` (Área Interna/Externa + áreas customizadas)
--   • Adiciona obra_local_id em inspecoes/ocorrencias/documentos_sst (FK opcional)
-- SST é o dono do cadastro de obras; o People consome via /api/integr/v1/obras.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Estende obras (campos da Receita/CNO + tipo de empreitada)
-- ----------------------------------------------------------------------------
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS logradouro TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS empreitada TEXT CHECK (empreitada IN ('total', 'parcial'));

-- ----------------------------------------------------------------------------
-- 2. obra_locais — áreas/locais dentro de uma obra
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS obra_locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'interna' CHECK (tipo IN ('interna', 'externa', 'outro')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_obra_locais_obra ON obra_locais(obra_id);
CREATE INDEX IF NOT EXISTS idx_obra_locais_empresa ON obra_locais(empresa_id);

ALTER TABLE obra_locais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obra_locais_select" ON obra_locais;
CREATE POLICY "obra_locais_select" ON obra_locais
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "obra_locais_write" ON obra_locais;
CREATE POLICY "obra_locais_write" ON obra_locais
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo'));

-- ----------------------------------------------------------------------------
-- 3. FK opcional de local nas rotinas de campo (texto mantido como fallback)
-- ----------------------------------------------------------------------------
ALTER TABLE inspecoes      ADD COLUMN IF NOT EXISTS obra_local_id UUID REFERENCES obra_locais(id);
ALTER TABLE ocorrencias    ADD COLUMN IF NOT EXISTS obra_local_id UUID REFERENCES obra_locais(id);
ALTER TABLE documentos_sst ADD COLUMN IF NOT EXISTS obra_local_id UUID REFERENCES obra_locais(id);
