-- ============================================================================
-- MIGRATION 0001 — CORE SCHEMA (Sistema de Gestão de SST)
-- Base: SST_System_Especificacao_Tecnica_v1.md — Seção 3
-- ============================================================================

-- ============================================
-- NÚCLEO: EMPRESA E PESSOAS
-- ============================================

CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  inscricao_estadual TEXT,
  endereco JSONB,
  telefones JSONB,
  tipo TEXT CHECK (tipo IN ('propria', 'contratante', 'terceira')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  cbo VARCHAR(10),
  grupo_risco INTEGER,
  descricao_atividades TEXT,
  riscos_associados JSONB,
  epis_obrigatorios JSONB,
  nrs_aplicaveis TEXT[],
  exames_obrigatorios JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cargos_empresa ON cargos(empresa_id);

CREATE TABLE colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  rg TEXT,
  data_nascimento DATE,
  sexo TEXT CHECK (sexo IN ('M', 'F', 'O')),
  telefone TEXT,
  email TEXT,
  endereco JSONB,
  cargo_id UUID REFERENCES cargos(id),
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  tipo_vinculo TEXT CHECK (tipo_vinculo IN ('clt', 'pj', 'temporario', 'estagiario', 'terceiro')),
  matricula TEXT,
  foto_url TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'afastado', 'ferias', 'demitido')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_colaboradores_empresa ON colaboradores(empresa_id);
CREATE INDEX idx_colaboradores_status ON colaboradores(status);
CREATE INDEX idx_colaboradores_cargo ON colaboradores(cargo_id);

-- ============================================
-- SAÚDE OCUPACIONAL (PCMSO)
-- ============================================

CREATE TABLE exames_medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'admissional', 'periodico', 'retorno_trabalho',
    'mudanca_funcao', 'demissional', 'complementar'
  )),
  subtipo TEXT,
  data_realizacao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  resultado TEXT CHECK (resultado IN ('apto', 'inapto', 'apto_restricao')),
  restricoes TEXT,
  medico_nome TEXT,
  crm TEXT,
  clinica TEXT,
  numero_aso TEXT,
  arquivo_url TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'vigente' CHECK (status IN ('vigente', 'vencido', 'substituido')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_exames_colaborador ON exames_medicos(colaborador_id);
CREATE INDEX idx_exames_vencimento ON exames_medicos(data_vencimento) WHERE status = 'vigente';

-- ============================================
-- TREINAMENTOS E CAPACITAÇÕES
-- ============================================

CREATE TABLE treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  nr_referencia TEXT,
  carga_horaria_horas NUMERIC(5,1) NOT NULL,
  conteudo_programatico TEXT[],
  validade_meses INTEGER,
  tipo TEXT CHECK (tipo IN ('obrigatorio', 'reciclagem', 'complementar', 'integracao')),
  modalidade TEXT CHECK (modalidade IN ('presencial', 'ead', 'hibrido')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treinamentos_realizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  treinamento_id UUID REFERENCES treinamentos(id),
  data_realizacao DATE NOT NULL,
  data_vencimento DATE,
  instrutor TEXT,
  entidade TEXT,
  local TEXT,
  nota_avaliacao NUMERIC(4,1),
  arquivo_certificado_url TEXT,
  status TEXT DEFAULT 'vigente' CHECK (status IN ('vigente', 'vencido', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_treinamentos_realizados_colab ON treinamentos_realizados(colaborador_id);
CREATE INDEX idx_treinamentos_realizados_venc ON treinamentos_realizados(data_vencimento) WHERE status = 'vigente';

-- ============================================
-- EPI
-- ============================================

CREATE TABLE epis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  ca VARCHAR(20) NOT NULL,
  ca_validade DATE,
  fabricante TEXT,
  tipo TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE epi_entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  epi_id UUID REFERENCES epis(id),
  data_entrega DATE NOT NULL,
  quantidade INTEGER DEFAULT 1,
  motivo TEXT CHECK (motivo IN ('primeiro_fornecimento', 'substituicao', 'desgaste', 'extravio', 'devolucao')),
  assinatura_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_epi_entregas_colab ON epi_entregas(colaborador_id);

-- ============================================
-- DOCUMENTOS DE CAMPO
-- ============================================

CREATE TABLE documentos_sst (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'apr', 'pt', 'autorizacao_nr10', 'autorizacao_nr35',
    'autorizacao_nr33', 'pet', 'ait', 'os_seguranca',
    'dialogo_seguranca', 'checklist', 'relatorio_inspecao'
  )),
  numero_sequencial SERIAL,
  titulo TEXT,
  empresa_id UUID REFERENCES empresas(id),
  local_trabalho TEXT,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE,
  status TEXT DEFAULT 'rascunho' CHECK (status IN (
    'rascunho', 'emitido', 'aprovado', 'executado', 'cancelado', 'vencido'
  )),
  conteudo JSONB NOT NULL,
  elaborado_por UUID REFERENCES colaboradores(id),
  aprovado_por UUID REFERENCES colaboradores(id),
  participantes UUID[],
  assinaturas JSONB,
  fotos JSONB,
  geolocalizacao JSONB,
  arquivo_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_docs_tipo ON documentos_sst(tipo);
CREATE INDEX idx_docs_empresa ON documentos_sst(empresa_id);
CREATE INDEX idx_docs_status ON documentos_sst(status);

-- ============================================
-- OCORRÊNCIAS E INVESTIGAÇÕES
-- ============================================

CREATE TABLE ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'acidente_tipico', 'acidente_trajeto', 'doenca_ocupacional',
    'quase_acidente', 'incidente', 'condicao_insegura', 'ato_inseguro',
    'desvio', 'emergencia'
  )),
  numero_sequencial SERIAL,
  data_ocorrencia TIMESTAMPTZ NOT NULL,
  local TEXT NOT NULL,
  empresa_id UUID REFERENCES empresas(id),
  descricao TEXT NOT NULL,
  colaborador_id UUID REFERENCES colaboradores(id),
  testemunhas UUID[],
  gravidade TEXT CHECK (gravidade IN ('leve', 'moderado', 'grave', 'fatal')),
  parte_corpo_atingida TEXT,
  natureza_lesao TEXT,
  agente_causador TEXT,
  investigacao JSONB,
  causa_raiz TEXT,
  acoes_corretivas JSONB,
  cat_emitida BOOLEAN DEFAULT false,
  cat_numero TEXT,
  dias_afastamento INTEGER,
  fotos JSONB,
  documentos_anexos JSONB,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'investigando', 'concluida', 'encerrada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ocorrencias_empresa ON ocorrencias(empresa_id);
CREATE INDEX idx_ocorrencias_data ON ocorrencias(data_ocorrencia DESC);
CREATE INDEX idx_ocorrencias_tipo ON ocorrencias(tipo);

-- ============================================
-- INSPEÇÕES E CHECKLISTS
-- ============================================

CREATE TABLE templates_inspecao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  categoria TEXT,
  itens JSONB NOT NULL,
  periodicidade TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inspecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates_inspecao(id),
  inspetor_id UUID REFERENCES colaboradores(id),
  empresa_id UUID REFERENCES empresas(id),
  local TEXT NOT NULL,
  data_inspecao TIMESTAMPTZ NOT NULL DEFAULT now(),
  respostas JSONB NOT NULL,
  percentual_conformidade NUMERIC(5,2),
  observacoes_gerais TEXT,
  fotos JSONB,
  geolocalizacao JSONB,
  assinatura_inspetor_url TEXT,
  assinatura_responsavel_url TEXT,
  status TEXT DEFAULT 'concluida',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_inspecoes_empresa ON inspecoes(empresa_id);
CREATE INDEX idx_inspecoes_data ON inspecoes(data_inspecao DESC);

-- ============================================
-- RBAC — PERFIS E USUÁRIOS
-- ============================================

CREATE TABLE perfis_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  permissoes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id),
  perfil_id UUID REFERENCES perfis_acesso(id),
  empresa_id UUID REFERENCES empresas(id),
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);

-- ============================================
-- AUDITORIA
-- ============================================

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  tabela TEXT NOT NULL,
  registro_id UUID,
  acao TEXT NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id UUID REFERENCES auth.users(id),
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_tabela ON audit_log(tabela, registro_id);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
