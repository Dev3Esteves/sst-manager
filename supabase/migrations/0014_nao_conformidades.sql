-- ============================================================================
-- MIGRATION 0014 — NÃO-CONFORMIDADES (NC) + AÇÕES CORRETIVAS (AC)
-- Base regulatória: ISO 45001 cl. 10.2 (Incidente, NC, Ação Corretiva).
-- Também atende NR-1 (PGR) e PDCA do SGI SISTENGE.
--
-- Promove a análise de causa raiz do JSONB legado em `ocorrencias.investigacao`
-- para tabelas relacionais formais com auditabilidade. Mantém compat: a coluna
-- JSONB e `ocorrencias.causa_raiz TEXT` permanecem (uso legado / fallback).
--
-- Estrutura:
--   nao_conformidades → {nc_causa_5whys, nc_causa_ishikawa, nc_acoes_corretivas}
--
-- empresa_id DENORMALIZADO em toda tabela filha (padrão RLS do projeto).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabela NÃO-CONFORMIDADES (NC) — registro central
-- ----------------------------------------------------------------------------
CREATE TABLE nao_conformidades (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  obra_id                     UUID REFERENCES obras(id) ON DELETE SET NULL,
  ocorrencia_id               UUID REFERENCES ocorrencias(id) ON DELETE SET NULL,
  numero_sequencial           SERIAL,
  titulo                      TEXT NOT NULL,
  descricao                   TEXT NOT NULL,
  origem                      TEXT NOT NULL
                                CHECK (origem IN (
                                  'ocorrencia', 'auditoria_interna', 'auditoria_externa',
                                  'inspecao', 'reclamacao', 'desvio', 'outro'
                                )),
  data_identificacao          DATE NOT NULL DEFAULT CURRENT_DATE,
  identificado_por_nome       TEXT,
  identificado_por_id         UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  severidade                  TEXT NOT NULL DEFAULT 'media'
                                CHECK (severidade IN ('baixa', 'media', 'alta', 'critica')),
  status                      TEXT NOT NULL DEFAULT 'aberta'
                                CHECK (status IN (
                                  'aberta',           -- recém-registrada
                                  'em_analise',       -- causa raiz em apuração
                                  'em_tratamento',    -- ações em execução
                                  'verificacao',      -- aguardando confirmar eficácia
                                  'encerrada',        -- ações eficazes verificadas
                                  'cancelada'         -- improcedente
                                )),
  data_encerramento           DATE,
  metodo_analise              TEXT
                                CHECK (metodo_analise IN ('5whys', 'ishikawa', 'ambos', 'outro')),
  causa_raiz_consolidada      TEXT,                 -- resumo final da análise
  observacoes                 TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE nao_conformidades IS
  'Não-conformidades (NC) conforme ISO 45001 cl. 10.2. Origem pode ser '
  'ocorrência, auditoria, inspeção ou reclamação. Causa raiz e ações '
  'corretivas vão em tabelas filhas; resumo consolidado fica em '
  'causa_raiz_consolidada. Numero_sequencial é por instalação (não por '
  'empresa) — formato típico de exibição: NC-0001.';

CREATE INDEX idx_nc_empresa ON nao_conformidades(empresa_id);
CREATE INDEX idx_nc_obra ON nao_conformidades(obra_id) WHERE obra_id IS NOT NULL;
CREATE INDEX idx_nc_ocorrencia ON nao_conformidades(ocorrencia_id) WHERE ocorrencia_id IS NOT NULL;
CREATE INDEX idx_nc_status ON nao_conformidades(status);
CREATE INDEX idx_nc_severidade ON nao_conformidades(severidade)
  WHERE severidade IN ('alta', 'critica');
CREATE INDEX idx_nc_data_identificacao ON nao_conformidades(data_identificacao DESC);

CREATE TRIGGER trg_nc_updated
  BEFORE UPDATE ON nao_conformidades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. NC_CAUSA_5WHYS — sequência ordenada de 5 porquês
--    Permite até 5 níveis (ou menos, se a causa raiz aparecer antes).
-- ----------------------------------------------------------------------------
CREATE TABLE nc_causa_5whys (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  nao_conformidade_id         UUID NOT NULL REFERENCES nao_conformidades(id) ON DELETE CASCADE,

  ordem                       INTEGER NOT NULL
                                CHECK (ordem BETWEEN 1 AND 5),
  pergunta                    TEXT NOT NULL,                          -- "Por quê <fato>?"
  resposta                    TEXT NOT NULL,
  eh_causa_raiz               BOOLEAN NOT NULL DEFAULT false,         -- marca o nível final

  UNIQUE (nao_conformidade_id, ordem)
);

COMMENT ON TABLE nc_causa_5whys IS
  '5 Whys (5 Porquês) — sequência ordenada de perguntas-resposta que rastreia '
  'do sintoma até a causa raiz. Marcar eh_causa_raiz=true no último nível '
  'identificado (geralmente o 5º, mas pode ser antes).';

CREATE INDEX idx_nc_5whys_nc ON nc_causa_5whys(nao_conformidade_id);

-- ----------------------------------------------------------------------------
-- 3. NC_CAUSA_ISHIKAWA — diagrama de espinha de peixe (6M)
--    Múltiplas causas por categoria; categorias adaptadas ao contexto SST.
-- ----------------------------------------------------------------------------
CREATE TABLE nc_causa_ishikawa (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  nao_conformidade_id         UUID NOT NULL REFERENCES nao_conformidades(id) ON DELETE CASCADE,

  categoria                   TEXT NOT NULL
                                CHECK (categoria IN (
                                  'metodo',          -- Procedimento, ordem de serviço, treinamento de uso
                                  'maquina',         -- Equipamento, ferramenta, sistema
                                  'material',        -- Insumo, EPI, peça
                                  'mao_de_obra',     -- Pessoa, competência, comportamento
                                  'medida',          -- Métrica, indicador, controle
                                  'meio_ambiente'    -- Local, clima, ergonomia, ruído
                                )),
  causa                       TEXT NOT NULL,
  eh_causa_raiz               BOOLEAN NOT NULL DEFAULT false,
  ordem                       INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE nc_causa_ishikawa IS
  'Diagrama de Ishikawa (espinha de peixe / 6M): Método, Máquina, Material, '
  'Mão-de-obra, Medida, Meio-ambiente. Múltiplas causas por categoria; '
  'marcar eh_causa_raiz=true nas causas que efetivamente geraram a NC.';

CREATE INDEX idx_nc_ishikawa_nc ON nc_causa_ishikawa(nao_conformidade_id);

-- ----------------------------------------------------------------------------
-- 4. NC_ACOES_CORRETIVAS — ações com PDCA + verificação de eficácia
-- ----------------------------------------------------------------------------
CREATE TABLE nc_acoes_corretivas (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  nao_conformidade_id         UUID NOT NULL REFERENCES nao_conformidades(id) ON DELETE CASCADE,

  numero_sequencial           INTEGER NOT NULL,                        -- "AC #1", "AC #2"
  tipo                        TEXT NOT NULL DEFAULT 'corretiva'
                                CHECK (tipo IN (
                                  'contencao',       -- ação imediata para limitar dano
                                  'corretiva',       -- elimina causa raiz
                                  'preventiva'       -- antes que aconteça
                                )),
  descricao                   TEXT NOT NULL,
  responsavel_nome            TEXT,
  responsavel_id              UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  data_prazo                  DATE NOT NULL,
  data_inicio                 DATE,
  data_conclusao              DATE,
  status                      TEXT NOT NULL DEFAULT 'planejada'
                                CHECK (status IN (
                                  'planejada', 'em_andamento', 'concluida', 'cancelada'
                                )),

  -- Verificação de eficácia (ISO 45001 cl. 10.2 d/e)
  evidencia_eficacia          TEXT,                                    -- ex.: "30 dias sem recorrência; auditoria interna OK"
  verificado_em               DATE,
  verificado_por_nome         TEXT,
  eficaz                      BOOLEAN,                                 -- null = não verificado ainda

  observacoes                 TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (nao_conformidade_id, numero_sequencial)
);

COMMENT ON TABLE nc_acoes_corretivas IS
  'Ações corretivas vinculadas a uma NC. Tipo contencao (limitar dano), '
  'corretiva (elimina causa raiz, ISO 45001 10.2 c) ou preventiva (antes do '
  'fato). Verificação de eficácia é mandatória para fechamento ISO — campos '
  'evidencia_eficacia + eficaz devem estar preenchidos antes de NC encerrar.';

CREATE INDEX idx_nc_ac_nc ON nc_acoes_corretivas(nao_conformidade_id);
CREATE INDEX idx_nc_ac_status ON nc_acoes_corretivas(status);
CREATE INDEX idx_nc_ac_prazo ON nc_acoes_corretivas(data_prazo)
  WHERE status IN ('planejada', 'em_andamento');
CREATE INDEX idx_nc_ac_responsavel ON nc_acoes_corretivas(responsavel_id)
  WHERE responsavel_id IS NOT NULL;

CREATE TRIGGER trg_nc_ac_updated
  BEFORE UPDATE ON nc_acoes_corretivas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- RLS — padrão do projeto: read empresa; write empresa+role
-- ============================================================================

ALTER TABLE nao_conformidades    ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_causa_5whys       ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_causa_ishikawa    ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_acoes_corretivas  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nc_select" ON nao_conformidades
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "nc_write" ON nao_conformidades
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "nc_5whys_select" ON nc_causa_5whys
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "nc_5whys_write" ON nc_causa_5whys
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "nc_ishikawa_select" ON nc_causa_ishikawa
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "nc_ishikawa_write" ON nc_causa_ishikawa
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "nc_ac_select" ON nc_acoes_corretivas
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "nc_ac_write" ON nc_acoes_corretivas
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));
