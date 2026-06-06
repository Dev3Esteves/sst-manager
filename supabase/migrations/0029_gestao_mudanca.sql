-- ============================================================================
-- MIGRATION 0029 — GESTÃO DE MUDANÇA / MOC (ISO 45001 8.1.3/8.1.4) — Fase A.2
-- Processo para gerir mudanças planejadas (temporárias/permanentes) que afetam
-- a SST: identificar perigos/riscos, avaliar controles, comunicar, implementar
-- e monitorar — incluindo aspectos de aquisição. Multiempresa (empresa_id + RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS gestao_mudanca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  numero_sequencial SERIAL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'produto_processo', 'local_trabalho', 'organizacao_trabalho', 'condicoes_trabalho',
    'equipamento', 'pessoal', 'requisito_legal', 'conhecimento_tecnologia', 'outro'
  )),
  carater TEXT NOT NULL DEFAULT 'permanente' CHECK (carater IN ('temporaria', 'permanente')),
  motivo TEXT,
  data_prevista DATE,
  obra_id UUID REFERENCES obras(id),
  -- Etapas da 8.1.3
  perigos_riscos TEXT,          -- 1. perigos/riscos/oportunidades identificados
  medidas_controle TEXT,        -- 2. controles existentes e requeridos avaliados
  comunicacao TEXT,             -- 3. comunicação às partes relevantes
  data_implementacao DATE,      -- 4. implementação
  avaliacao_pos TEXT,           -- 5. monitoramento/revisão + consequências não intencionais
  responsavel_nome TEXT,
  responsavel_id UUID REFERENCES colaboradores(id),
  -- Aquisição (8.1.4)
  envolve_aquisicao BOOLEAN NOT NULL DEFAULT false,
  criterios_aquisicao TEXT,
  status TEXT NOT NULL DEFAULT 'proposta' CHECK (status IN (
    'proposta', 'em_analise', 'aprovada', 'implementada', 'em_monitoramento', 'concluida', 'rejeitada', 'cancelada'
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gestao_mudanca_empresa ON gestao_mudanca(empresa_id);

ALTER TABLE gestao_mudanca ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gestao_mudanca_select" ON gestao_mudanca;
CREATE POLICY "gestao_mudanca_select" ON gestao_mudanca
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "gestao_mudanca_write" ON gestao_mudanca;
CREATE POLICY "gestao_mudanca_write" ON gestao_mudanca
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'engenheiro_seg', 'tec_seguranca', 'gestor_diretoria'));
