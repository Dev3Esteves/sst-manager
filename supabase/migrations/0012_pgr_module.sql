-- ============================================================================
-- MIGRATION 0012 — MÓDULO PGR (Programa de Gerenciamento de Riscos)
-- Base regulatória: NR-1 (Portaria SEPRT 6.730/2020 + MTP 423/2021 + MTE 1.419/2024
-- — incluindo riscos psicossociais com prazo 25/05/2026).
-- Base de design: estrutura real dos PGRs SISTENGE (FO-121-00),
-- vide docs/research/pgr-sistenge-anatomia.md.
--
-- Estrutura: pgr → pgr_ghe → {pgr_ghe_cargo, pgr_risco, pgr_epi_ghe}
--                 → {pgr_acao, pgr_medida_controle}
--
-- empresa_id é DENORMALIZADO em toda tabela filha para manter o padrão RLS
-- do projeto (filtro direto, sem EXISTS subquery cara).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Estender `obras` com atributos da Receita Federal e dimensionamento
-- ----------------------------------------------------------------------------
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS cno TEXT,
  ADD COLUMN IF NOT EXISTS num_empregados_max INTEGER;

COMMENT ON COLUMN obras.cno IS
  'Cadastro Nacional de Obras da Receita Federal (formato XX.XXX.XXXXX/XX). '
  'Distinto do CNPJ — vincula a obra para fins previdenciários (eSocial S-2240).';

COMMENT ON COLUMN obras.num_empregados_max IS
  'Pico histórico de colaboradores alocados à obra (todas as empresas — '
  'própria + prestadoras). Aparece no cabeçalho do PGR como "Nº Geral de '
  'empregados até".';

-- ----------------------------------------------------------------------------
-- 1. Tabela PGR — uma linha por revisão de PGR de uma obra
-- ----------------------------------------------------------------------------
CREATE TABLE pgr (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  obra_id                     UUID NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,

  -- Identificação da revisão
  numero_revisao              INTEGER NOT NULL DEFAULT 0,
  descricao_revisao           TEXT,                                 -- ex: "Revisão de GHE 01 para GHE 02"

  -- Vigência
  data_emissao                DATE NOT NULL,
  data_vencimento             DATE NOT NULL,                        -- normalmente emissao + 12 meses (NR-1)
  status                      TEXT NOT NULL DEFAULT 'rascunho'
                                CHECK (status IN ('rascunho', 'vigente', 'superseded', 'vencido')),

  -- Responsáveis técnicos
  responsavel_elaboracao_nome    TEXT,
  responsavel_elaboracao_funcao  TEXT,
  responsavel_elaboracao_crea    TEXT,
  responsavel_obra_nome          TEXT,
  responsavel_obra_funcao        TEXT,
  responsavel_obra_crea          TEXT,

  -- Snapshot da obra no momento da emissão (caso obra mude depois)
  cno_obra_snapshot           TEXT,
  num_empregados_snapshot     INTEGER,
  data_inicio_obra_snapshot   DATE,

  -- Metadados de geração
  codigo_formulario           TEXT NOT NULL DEFAULT 'FO-121-00',    -- código SGI SISTENGE
  arquivo_pdf_url             TEXT,                                 -- após geração e selagem
  arquivo_pdf_hash            TEXT,                                 -- SHA-256 do PDF selado

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (obra_id, numero_revisao)
);

COMMENT ON TABLE pgr IS
  'Programa de Gerenciamento de Riscos (NR-1). Uma linha por revisão; nova '
  'revisão = novo registro, anterior marcado como ''superseded''. Periodicidade '
  'de revisão típica: 12 meses ou ao haver inovação tecnológica / ocorrência '
  'grave / exigência da autoridade.';

CREATE INDEX idx_pgr_empresa ON pgr(empresa_id);
CREATE INDEX idx_pgr_obra ON pgr(obra_id);
CREATE INDEX idx_pgr_status ON pgr(status);
CREATE INDEX idx_pgr_vencimento ON pgr(data_vencimento) WHERE status = 'vigente';

CREATE TRIGGER trg_pgr_updated
  BEFORE UPDATE ON pgr
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Tabela PGR_GHE — Grupo Homogêneo de Exposição (entidade central do PGR)
-- ----------------------------------------------------------------------------
CREATE TABLE pgr_ghe (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  pgr_id                      UUID NOT NULL REFERENCES pgr(id) ON DELETE CASCADE,

  codigo                      TEXT NOT NULL,                       -- "GHE 01", "GHE 02", ...
  descricao                   TEXT NOT NULL,                       -- "ADMINISTRAÇÃO"
  funcao_posicao              TEXT,                                -- "Administração", "Engenharia / Operacional"
  area_identificacao          TEXT,                                -- "CANTEIRO ADMINISTRATIVO"
  caracterizacao_atividades   TEXT,
  local_trabalho              TEXT,                                -- "Escritório", "Campo", "Escritório / Campo"
  num_empregados_expostos     INTEGER,
  ordem                       INTEGER NOT NULL DEFAULT 0,

  UNIQUE (pgr_id, codigo)
);

COMMENT ON TABLE pgr_ghe IS
  'Grupo Homogêneo de Exposição. Entidade central do PGR: agrupa cargos com '
  'exposição similar. Cargos, riscos, EPIs e ações se relacionam com GHEs.';

CREATE INDEX idx_pgr_ghe_pgr ON pgr_ghe(pgr_id);
CREATE INDEX idx_pgr_ghe_empresa ON pgr_ghe(empresa_id);

-- ----------------------------------------------------------------------------
-- 3. PGR_GHE_CARGO — N:M cargos × GHE
--    Hybrid: cargo_titulo (texto livre, requerido) + cargo_id (FK opcional).
--    Permite registrar cargos que ainda não foram cadastrados em `cargos`.
-- ----------------------------------------------------------------------------
CREATE TABLE pgr_ghe_cargo (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  pgr_ghe_id                  UUID NOT NULL REFERENCES pgr_ghe(id) ON DELETE CASCADE,

  cargo_titulo                TEXT NOT NULL,
  cargo_id                    UUID REFERENCES cargos(id) ON DELETE SET NULL,
  ordem                       INTEGER NOT NULL DEFAULT 0,

  UNIQUE (pgr_ghe_id, cargo_titulo)
);

CREATE INDEX idx_pgr_ghe_cargo_ghe ON pgr_ghe_cargo(pgr_ghe_id);
CREATE INDEX idx_pgr_ghe_cargo_id ON pgr_ghe_cargo(cargo_id) WHERE cargo_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 4. PGR_RISCO — Inventário de Riscos (Anexo III)
--    Uma linha por par (GHE, agente). 12 colunas do template SISTENGE.
-- ----------------------------------------------------------------------------
CREATE TABLE pgr_risco (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  pgr_id                      UUID NOT NULL REFERENCES pgr(id) ON DELETE CASCADE,
  pgr_ghe_id                  UUID NOT NULL REFERENCES pgr_ghe(id) ON DELETE CASCADE,

  categoria                   TEXT NOT NULL
                                CHECK (categoria IN (
                                  'fisico', 'quimico', 'biologico',
                                  'ergonomico', 'acidente', 'psicossocial'
                                )),
  agente_ambiental            TEXT NOT NULL,                       -- "RUÍDO", "QUEDA DE ALTURA", "ASSÉDIO MORAL"
  codigo_esocial              TEXT,                                -- referência a esocial_agente_nocivo.codigo (validado em A.4)
  fontes_geradoras            TEXT,
  trajetoria                  TEXT,
  via_ingresso                TEXT,
  possiveis_danos             TEXT,
  tipo_exposicao              TEXT
                                CHECK (tipo_exposicao IN ('eventual', 'moderado', 'habitual')),
  categoria_risco             TEXT
                                CHECK (categoria_risco IN (
                                  'muito_baixo', 'baixo', 'medio', 'alto', 'muito_alto'
                                )),
  observacoes                 TEXT,
  ordem                       INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE pgr_risco IS
  'Inventário de Riscos (Anexo III). Classificação é qualitativa (tipo_exposicao '
  'x categoria_risco), não matriz numérica X×Y. Categoria ''psicossocial'' '
  'cobre obrigação NR-1 Port. 1.419/2024 (prazo 25/05/2026).';

CREATE INDEX idx_pgr_risco_pgr ON pgr_risco(pgr_id);
CREATE INDEX idx_pgr_risco_ghe ON pgr_risco(pgr_ghe_id);
CREATE INDEX idx_pgr_risco_categoria ON pgr_risco(categoria);
CREATE INDEX idx_pgr_risco_categoria_risco ON pgr_risco(categoria_risco)
  WHERE categoria_risco IN ('alto', 'muito_alto');  -- riscos críticos para priorização

-- ----------------------------------------------------------------------------
-- 5. PGR_ACAO — Plano de Ação 5W1H (Anexo I — Cronograma)
-- ----------------------------------------------------------------------------
CREATE TABLE pgr_acao (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  pgr_id                      UUID NOT NULL REFERENCES pgr(id) ON DELETE CASCADE,

  numero_item                 INTEGER NOT NULL,
  o_que                       TEXT NOT NULL,                       -- ação
  quem                        TEXT,                                -- "SMS", "TODOS", responsável
  onde                        TEXT,                                -- "MATRIZ", "Obra X"
  quando                      TEXT,                                -- "03/2026", "PERMANENTE", "PERIODICO"
  por_que                     TEXT,
  como                        TEXT,
  status                      TEXT NOT NULL DEFAULT 'planejado'
                                CHECK (status IN (
                                  'planejado', 'em_andamento', 'concluido',
                                  'pendente', 'continuo', 'cancelado'
                                )),
  observacoes                 TEXT,

  UNIQUE (pgr_id, numero_item)
);

COMMENT ON TABLE pgr_acao IS
  '5W1H — Plano de Ação do PGR (SISTENGE não usa "QUANTO"/custo). '
  'Aparece no Anexo I (Cronograma Anual de Atividades) com 17 itens típicos.';

CREATE INDEX idx_pgr_acao_pgr ON pgr_acao(pgr_id);
CREATE INDEX idx_pgr_acao_status ON pgr_acao(status);

-- ----------------------------------------------------------------------------
-- 6. PGR_MEDIDA_CONTROLE — Medidas de Controle (Anexo VI)
-- ----------------------------------------------------------------------------
CREATE TABLE pgr_medida_controle (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  pgr_id                      UUID NOT NULL REFERENCES pgr(id) ON DELETE CASCADE,
  pgr_ghe_id                  UUID REFERENCES pgr_ghe(id) ON DELETE CASCADE,  -- NULL = aplicável a todos

  agente_ambiental            TEXT,                                -- vínculo com pgr_risco.agente_ambiental
  tipo_medida                 TEXT NOT NULL
                                CHECK (tipo_medida IN (
                                  'coletiva', 'administrativa', 'individual'
                                )),
  nivel_niosh                 INTEGER
                                CHECK (nivel_niosh BETWEEN 1 AND 5),
                                -- 1=Eliminação, 2=Substituição, 3=Engenharia,
                                -- 4=Administrativa, 5=EPI (NIOSH Hierarchy of Controls)
  acao                        TEXT NOT NULL,                       -- "Uso de EPI"
  detalhamento                TEXT,                                -- "Uso de protetor auricular tipo plug"
  abrangencia                 TEXT,                                -- "Quando ultrapassar 80db"
  periodicidade               TEXT,
  status                      TEXT DEFAULT 'planejado'
                                CHECK (status IN (
                                  'planejado', 'em_andamento', 'implantado',
                                  'eventual', 'pendente', 'cancelado'
                                )),
  ordem                       INTEGER NOT NULL DEFAULT 0
);

COMMENT ON COLUMN pgr_medida_controle.nivel_niosh IS
  'Hierarquia NIOSH de controles: 1=Eliminação (mais eficaz) → 5=EPI (último '
  'recurso). Exigido pela ISO 45001 cl. 8.1.2 e pela NR-1 (PGR). Alerta '
  'recomendado quando todos os controles para um risco estão em níveis 4-5.';

CREATE INDEX idx_pgr_medida_pgr ON pgr_medida_controle(pgr_id);
CREATE INDEX idx_pgr_medida_ghe ON pgr_medida_controle(pgr_ghe_id) WHERE pgr_ghe_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 7. PGR_EPI_GHE — Matriz EPI × GHE (Anexo VII)
--    Hybrid: epi_id FK opcional + epi_nome obrigatório (mesmo padrão de cargo).
-- ----------------------------------------------------------------------------
CREATE TABLE pgr_epi_ghe (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  pgr_id                      UUID NOT NULL REFERENCES pgr(id) ON DELETE CASCADE,
  pgr_ghe_id                  UUID NOT NULL REFERENCES pgr_ghe(id) ON DELETE CASCADE,

  epi_nome                    TEXT NOT NULL,                       -- "Capacete", "Luva Nitrílica"
  epi_id                      UUID REFERENCES epis(id) ON DELETE SET NULL,
  uso                         TEXT NOT NULL DEFAULT 'permanente'
                                CHECK (uso IN ('permanente', 'eventual', 'atividade_especifica')),
  observacao                  TEXT,
  ordem                       INTEGER NOT NULL DEFAULT 0,

  UNIQUE (pgr_ghe_id, epi_nome)
);

CREATE INDEX idx_pgr_epi_ghe_ghe ON pgr_epi_ghe(pgr_ghe_id);
CREATE INDEX idx_pgr_epi_ghe_epi ON pgr_epi_ghe(epi_id) WHERE epi_id IS NOT NULL;

-- ============================================================================
-- RLS — todas as tabelas seguem o padrão `empresa_id = user_empresa_id()
--       OR user_perfil_nome() = 'admin'`
-- ============================================================================

ALTER TABLE pgr                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_ghe                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_ghe_cargo          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_risco              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_acao               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_medida_controle    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_epi_ghe            ENABLE ROW LEVEL SECURITY;

-- PGR — admin vê tudo; tec_seguranca da empresa edita; outros só leem (empresa)
CREATE POLICY "pgr_select" ON pgr
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

CREATE POLICY "pgr_write" ON pgr
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca')
  );

-- Tabelas filhas: mesmo padrão; macro abaixo aplica a cada uma
CREATE POLICY "pgr_ghe_select" ON pgr_ghe
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "pgr_ghe_write" ON pgr_ghe
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "pgr_ghe_cargo_select" ON pgr_ghe_cargo
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "pgr_ghe_cargo_write" ON pgr_ghe_cargo
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "pgr_risco_select" ON pgr_risco
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "pgr_risco_write" ON pgr_risco
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "pgr_acao_select" ON pgr_acao
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "pgr_acao_write" ON pgr_acao
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "pgr_medida_select" ON pgr_medida_controle
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "pgr_medida_write" ON pgr_medida_controle
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "pgr_epi_ghe_select" ON pgr_epi_ghe
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "pgr_epi_ghe_write" ON pgr_epi_ghe
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));
