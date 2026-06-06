-- ============================================================================
-- MIGRATION 0023 — CADASTROS DE APOIO: INSTRUTORES, ENTIDADES, DDS (F2.3 / F2.4)
--   • instrutores + entidades_treinamento  → ligados a treinamentos_realizados
--   • dds_temas + dds_mediadores            → catálogos de apoio do DDS
-- Todas multiempresa (empresa_id DEFAULT user_empresa_id() + RLS), padrão SST.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. INSTRUTORES (quem ministra o treinamento)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instrutores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  registro_tipo TEXT CHECK (registro_tipo IN ('mte', 'crea', 'cref', 'crm', 'outro')),
  registro_numero TEXT,
  formacao TEXT,
  telefone TEXT,
  email TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instrutores_empresa ON instrutores(empresa_id);

ALTER TABLE instrutores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "instrutores_select" ON instrutores;
CREATE POLICY "instrutores_select" ON instrutores
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "instrutores_write" ON instrutores;
CREATE POLICY "instrutores_write" ON instrutores
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'));

-- ----------------------------------------------------------------------------
-- 2. ENTIDADES DE TREINAMENTO (Senai, Senac, etc.) — endereço via BrasilAPI
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entidades_treinamento (
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
CREATE INDEX IF NOT EXISTS idx_entidades_treinamento_empresa ON entidades_treinamento(empresa_id);

ALTER TABLE entidades_treinamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entidades_treinamento_select" ON entidades_treinamento;
CREATE POLICY "entidades_treinamento_select" ON entidades_treinamento
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "entidades_treinamento_write" ON entidades_treinamento;
CREATE POLICY "entidades_treinamento_write" ON entidades_treinamento
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'));

-- ----------------------------------------------------------------------------
-- 3. FKs em treinamentos_realizados (snapshot textual instrutor/entidade mantido)
-- ----------------------------------------------------------------------------
ALTER TABLE treinamentos_realizados
  ADD COLUMN IF NOT EXISTS instrutor_id UUID REFERENCES instrutores(id),
  ADD COLUMN IF NOT EXISTS entidade_id UUID REFERENCES entidades_treinamento(id);

-- ----------------------------------------------------------------------------
-- 4. DDS — catálogo de temas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dds_temas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dds_temas_empresa ON dds_temas(empresa_id);

ALTER TABLE dds_temas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dds_temas_select" ON dds_temas;
CREATE POLICY "dds_temas_select" ON dds_temas
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "dds_temas_write" ON dds_temas;
CREATE POLICY "dds_temas_write" ON dds_temas
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo'));

-- ----------------------------------------------------------------------------
-- 5. DDS — catálogo de mediadores (interno: vinculado a colaborador; ou externo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dds_mediadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT,
  tipo TEXT NOT NULL DEFAULT 'interno' CHECK (tipo IN ('interno', 'externo')),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dds_mediadores_empresa ON dds_mediadores(empresa_id);

ALTER TABLE dds_mediadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dds_mediadores_select" ON dds_mediadores;
CREATE POLICY "dds_mediadores_select" ON dds_mediadores
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "dds_mediadores_write" ON dds_mediadores;
CREATE POLICY "dds_mediadores_write" ON dds_mediadores
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo'));
