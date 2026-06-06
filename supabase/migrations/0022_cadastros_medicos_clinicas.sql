-- ============================================================================
-- MIGRATION 0022 — CADASTROS DE APOIO: MÉDICOS E CLÍNICAS (Fase 2.1 / 2.2)
-- Substitui os campos texto-livre de exames_medicos (medico_nome/crm/clinica)
-- por FKs para cadastros estruturados, mantendo os campos texto como SNAPSHOT
-- (retrocompatibilidade e histórico imutável do ASO).
-- Tabelas multiempresa (empresa_id + RLS por empresa ativa), padrão do SST.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MÉDICOS (responsável pelo ASO) — autocomplete + integração consultacrm
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  crm TEXT NOT NULL,
  uf_crm TEXT,
  especialidade TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  telefone TEXT,
  email TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medicos_empresa ON medicos(empresa_id);
-- CRM único por empresa (case-insensitive, considerando a UF)
CREATE UNIQUE INDEX IF NOT EXISTS uq_medicos_empresa_crm
  ON medicos(empresa_id, lower(crm), COALESCE(upper(uf_crm), ''));

ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medicos_select" ON medicos;
CREATE POLICY "medicos_select" ON medicos
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "medicos_write" ON medicos;
CREATE POLICY "medicos_write" ON medicos
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  );

-- ----------------------------------------------------------------------------
-- 2. CLÍNICAS (local de realização do exame) — autopreenchimento via BrasilAPI
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  municipio TEXT,
  uf TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clinicas_empresa ON clinicas(empresa_id);

ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinicas_select" ON clinicas;
CREATE POLICY "clinicas_select" ON clinicas
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "clinicas_write" ON clinicas;
CREATE POLICY "clinicas_write" ON clinicas
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  );

-- ----------------------------------------------------------------------------
-- 3. FKs em exames_medicos (snapshot textual preservado)
-- ----------------------------------------------------------------------------
ALTER TABLE exames_medicos
  ADD COLUMN IF NOT EXISTS medico_id UUID REFERENCES medicos(id),
  ADD COLUMN IF NOT EXISTS clinica_id UUID REFERENCES clinicas(id);
