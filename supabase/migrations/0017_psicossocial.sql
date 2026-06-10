-- ============================================================================
-- MIGRATION 0017 — Módulo NR-01 Riscos Psicossociais (FRPRT)
-- ============================================================================
--
-- Base regulatória: NR-01 (Portaria MTE 1.419/2024) — Fatores de Risco
-- Psicossociais Relacionados ao Trabalho no GRO. Fiscalização punitiva desde
-- 26/05/2026. O psicossocial entra como fator ergonômico (NR-01 + NR-17) e
-- alimenta o Inventário de Riscos do PGR (pgr_risco categoria='psicossocial').
--
-- Metodologia: questionário psicossocial (ex.: COPSOQ II-Br) → score 0-100 por
-- dimensão → classificação por tercis (verde/amarelo/vermelho) → agregação por
-- GHE (reusa pgr_ghe) com mínimo de respondentes (anonimato/LGPD). O catálogo
-- psi_instrumento é multi-instrumento (COPSOQ, HSE-IT, PROART, desfechos).
--
-- Princípios:
--   - Reusa empresas / obras / pgr / pgr_ghe — NÃO recria estrutura org.
--   - empresa_id DENORMALIZADO em toda tabela (padrão RLS do projeto).
--   - Respostas ANÔNIMAS: sem qualquer FK para pessoa. Vínculo só com
--     campanha + GHE. Acesso às respostas cruas apenas via service role.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Instrumento (catálogo global, versionado) — ex.: COPSOQ II-Br médio/curto
-- ----------------------------------------------------------------------------
CREATE TABLE psi_instrumento (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,                 -- "COPSOQ II-Br (curta)"
  versao      TEXT NOT NULL,                 -- "medio" | "curto"
  definicao   JSONB NOT NULL,                -- domínios/dimensões/itens/escala/classificação
  oficial     BOOLEAN NOT NULL DEFAULT false,-- false = texto rascunho (não-licenciado)
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nome, versao)
);

COMMENT ON TABLE psi_instrumento IS
  'Instrumento psicossocial versionado (catálogo). `oficial=false` indica texto '
  'representativo/rascunho — substituir pelo texto licenciado (COPSOQ II-Br) '
  'antes do uso em produção.';

-- ----------------------------------------------------------------------------
-- 2. Campanha de aplicação — sempre vinculada a um PGR (obra)
-- ----------------------------------------------------------------------------
CREATE TABLE psi_campanha (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  pgr_id            UUID NOT NULL REFERENCES pgr(id) ON DELETE CASCADE,
  instrumento_id    UUID NOT NULL REFERENCES psi_instrumento(id) ON DELETE RESTRICT,

  titulo            TEXT NOT NULL,
  versao_aplicada   TEXT NOT NULL DEFAULT 'curto',   -- "curto" | "medio"
  data_inicio       DATE NOT NULL,
  data_fim          DATE,
  status            TEXT NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN ('rascunho', 'aberta', 'encerrada', 'analisada')),
  min_respondentes  SMALLINT NOT NULL DEFAULT 5,      -- proteção de anonimato (k-anonimato)

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE psi_campanha IS
  'Campanha de avaliação psicossocial sobre um PGR. Os GHEs avaliados são os '
  'pgr_ghe do PGR vinculado. min_respondentes protege o anonimato na agregação.';

CREATE INDEX idx_psi_campanha_empresa ON psi_campanha(empresa_id);
CREATE INDEX idx_psi_campanha_pgr ON psi_campanha(pgr_id);
CREATE INDEX idx_psi_campanha_status ON psi_campanha(status);

CREATE TRIGGER trg_psi_campanha_updated
  BEFORE UPDATE ON psi_campanha
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Convite — 1 link/QR anônimo por (campanha, GHE). Aceita N respostas.
--    Não é de uso único: o mesmo QR é usado por todos do GHE; a adesão é
--    medida por contagem de respostas vs num_empregados_expostos do GHE.
-- ----------------------------------------------------------------------------
CREATE TABLE psi_convite (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  campanha_id  UUID NOT NULL REFERENCES psi_campanha(id) ON DELETE CASCADE,
  pgr_ghe_id   UUID NOT NULL REFERENCES pgr_ghe(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,         -- aleatório, usado na URL pública /q/<token>
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, pgr_ghe_id)
);

CREATE INDEX idx_psi_convite_campanha ON psi_convite(campanha_id);
CREATE INDEX idx_psi_convite_token ON psi_convite(token);

-- ----------------------------------------------------------------------------
-- 4. Resposta (ANÔNIMA) — sem qualquer FK para pessoa
-- ----------------------------------------------------------------------------
CREATE TABLE psi_resposta (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  campanha_id   UUID NOT NULL REFERENCES psi_campanha(id) ON DELETE CASCADE,
  pgr_ghe_id    UUID NOT NULL REFERENCES pgr_ghe(id) ON DELETE CASCADE,
  respondido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Demografia OPCIONAL e agregável; nunca identificável. Em GHE pequeno,
  -- cruzamentos demográficos devem ser suprimidos na exibição (k-anonimato).
  faixa_etaria  TEXT,
  sexo          TEXT
);

COMMENT ON TABLE psi_resposta IS
  'Resposta anônima. Sem FK para colaborador/usuário por exigência de anonimato '
  '(NR-01 + LGPD). Inserção e leitura crua apenas via service role no servidor.';

CREATE INDEX idx_psi_resposta_campanha_ghe ON psi_resposta(campanha_id, pgr_ghe_id);

CREATE TABLE psi_resposta_item (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id  UUID NOT NULL REFERENCES psi_resposta(id) ON DELETE CASCADE,
  item_id      TEXT NOT NULL,                -- ex.: "Q1A" (COPSOQ) / "D1" (HSE)
  valor        SMALLINT NOT NULL CHECK (valor BETWEEN 0 AND 100)
);

CREATE INDEX idx_psi_resposta_item_resposta ON psi_resposta_item(resposta_id);

-- ----------------------------------------------------------------------------
-- 5. Resultado calculado por dimensão × GHE (já na direção de risco 0-100)
-- ----------------------------------------------------------------------------
CREATE TABLE psi_resultado_dimensao (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  campanha_id    UUID NOT NULL REFERENCES psi_campanha(id) ON DELETE CASCADE,
  pgr_ghe_id     UUID NOT NULL REFERENCES pgr_ghe(id) ON DELETE CASCADE,
  dominio        TEXT NOT NULL,
  dimensao_id    TEXT NOT NULL,
  dimensao_nome  TEXT NOT NULL,
  score_risco    NUMERIC(5,2),               -- NULL quando suprimido por < min_respondentes
  classificacao  TEXT CHECK (classificacao IN ('verde', 'amarelo', 'vermelho')),
  n_respondentes INTEGER NOT NULL DEFAULT 0,
  suprimido      BOOLEAN NOT NULL DEFAULT false,
  calculado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, pgr_ghe_id, dimensao_id)
);

COMMENT ON TABLE psi_resultado_dimensao IS
  'Score de risco agregado por GHE e dimensão. suprimido=true quando o GHE teve '
  'menos respondentes que min_respondentes (anonimato). Resultados médio/alto '
  'alimentam o Inventário do PGR (pgr_risco categoria=psicossocial).';

CREATE INDEX idx_psi_resultado_campanha ON psi_resultado_dimensao(campanha_id);
CREATE INDEX idx_psi_resultado_ghe ON psi_resultado_dimensao(pgr_ghe_id);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE psi_instrumento        ENABLE ROW LEVEL SECURITY;
ALTER TABLE psi_campanha           ENABLE ROW LEVEL SECURITY;
ALTER TABLE psi_convite            ENABLE ROW LEVEL SECURITY;
ALTER TABLE psi_resposta           ENABLE ROW LEVEL SECURITY;
ALTER TABLE psi_resposta_item      ENABLE ROW LEVEL SECURITY;
ALTER TABLE psi_resultado_dimensao ENABLE ROW LEVEL SECURITY;

-- Instrumento: catálogo — qualquer autenticado lê; só admin escreve.
CREATE POLICY "psi_instrumento_select" ON psi_instrumento
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "psi_instrumento_write" ON psi_instrumento
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- Campanha / convite / resultado: padrão empresa (admin/tec_seguranca escrevem).
CREATE POLICY "psi_campanha_select" ON psi_campanha
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "psi_campanha_write" ON psi_campanha
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "psi_convite_select" ON psi_convite
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "psi_convite_write" ON psi_convite
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "psi_resultado_select" ON psi_resultado_dimensao
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
CREATE POLICY "psi_resultado_write" ON psi_resultado_dimensao
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

-- Respostas cruas: SEM policy de acesso para authenticated/anon (deny-all).
-- Inserção (coleta anônima via token) e leitura (cálculo) acontecem apenas via
-- service role no servidor, que bypassa RLS. Reforça o anonimato: ninguém lê
-- respostas individuais pela API pública/autenticada.
-- (RLS habilitado sem policies = nega tudo para roles não-service.)

COMMENT ON TABLE psi_resposta_item IS
  'Itens da resposta anônima. Acesso apenas via service role (RLS sem policies).';
