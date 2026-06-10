-- ============================================================================
-- MIGRATION 0047 — Camada NR-1 (Probabilidade × Severidade × Exposição)
-- ============================================================================
--
-- Base regulatória: NR-01 / Guia MTE de Fatores de Risco Psicossociais. O nível
-- de risco ocupacional NÃO pode ser determinado pelo score do questionário
-- isoladamente — exige avaliação técnica de Severidade (e Exposição) sobre a
-- Probabilidade estimada pelo instrumento. Esta migration adiciona, em
-- psi_resultado_dimensao, os campos dessa avaliação técnica e o nível resultante.
--
--   Probabilidade (1-5): derivada do score_risco do questionário (0-100).
--   Severidade   (1-5): avaliação técnica do responsável (tec_seguranca).
--   Exposição    (1-5): avaliação técnica (opcional; ausente → matriz P×S).
--   produto_nr1: P×S (1-25) ou P×S×E (1-125).
--   nivel_risco_nr1: baixo / medio / alto / critico (mapeia para categoria_risco
--                    do Inventário do PGR — 5 níveis).
-- ============================================================================

ALTER TABLE psi_resultado_dimensao
  ADD COLUMN IF NOT EXISTS probabilidade   SMALLINT CHECK (probabilidade BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS severidade      SMALLINT CHECK (severidade   BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS exposicao       SMALLINT CHECK (exposicao    BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS produto_nr1     SMALLINT,
  ADD COLUMN IF NOT EXISTS nivel_risco_nr1 TEXT
                            CHECK (nivel_risco_nr1 IN ('baixo', 'medio', 'alto', 'critico')),
  ADD COLUMN IF NOT EXISTS severidade_em   TIMESTAMPTZ;

COMMENT ON COLUMN psi_resultado_dimensao.probabilidade IS
  'Probabilidade NR-1 (1-5) derivada do score_risco do questionário.';
COMMENT ON COLUMN psi_resultado_dimensao.severidade IS
  'Severidade NR-1 (1-5) — avaliação técnica do responsável (não vem do questionário).';
COMMENT ON COLUMN psi_resultado_dimensao.exposicao IS
  'Exposição NR-1 (1-5) — avaliação técnica opcional; ausente usa matriz P×S.';
COMMENT ON COLUMN psi_resultado_dimensao.nivel_risco_nr1 IS
  'Nível de risco NR-1 (baixo/medio/alto/critico) = banda de produto_nr1. '
  'Mapeia para pgr_risco.categoria_risco (crítico→muito_alto) no lançamento ao PGR.';
