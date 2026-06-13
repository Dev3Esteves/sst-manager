-- ============================================================================
-- 0056 — Calibração de faixas psicossociais por PERCENTIS da própria empresa
-- ============================================================================
-- Em vez de tercis fixos (0-33-67-100), os cortes verde/amarelo/vermelho de
-- cada DIMENSÃO podem ser derivados da distribuição real de scores de risco da
-- própria empresa (norma relativa). A calibração é por (empresa, instrumento,
-- versão, dimensão); o cálculo (percentis) roda via service role sobre as
-- respostas anônimas e grava apenas os CORTES agregados — nenhum dado
-- individual é exposto. Mapeamento padrão P50/P80 (ver scoring.ts).

CREATE TABLE psi_calibracao (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  instrumento_key TEXT NOT NULL,                 -- 'copsoq' | 'hse' | ...
  versao          TEXT NOT NULL,                 -- versao_aplicada da campanha
  dimensao_id     TEXT NOT NULL,                 -- id da dimensão no instrumento
  verde_max       NUMERIC(5,2) NOT NULL,         -- limite superior do verde (= P_verde)
  amarelo_max     NUMERIC(5,2) NOT NULL,         -- limite superior do amarelo (= P_amarelo)
  p_verde         SMALLINT NOT NULL,             -- percentil usado p/ verde (ex.: 50)
  p_amarelo       SMALLINT NOT NULL,             -- percentil usado p/ amarelo (ex.: 80)
  n_amostral      INTEGER NOT NULL,              -- nº de respondentes na distribuição da dimensão
  calculado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, instrumento_key, versao, dimensao_id)
);

CREATE INDEX idx_psi_calibracao_lookup
  ON psi_calibracao (empresa_id, instrumento_key, versao);

-- RLS: padrão empresa (igual psi_resultado_dimensao). Escrita também via service
-- role no servidor (cálculo da calibração), que bypassa RLS.
ALTER TABLE psi_calibracao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psi_calibracao_select" ON psi_calibracao
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

CREATE POLICY "psi_calibracao_write" ON psi_calibracao
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca'));

COMMENT ON TABLE psi_calibracao IS
  'Cortes verde/amarelo/vermelho por dimensão calibrados pelos percentis da própria empresa. Lidos por calcularResultados para classificar; calculados por calibrarFaixas.';
