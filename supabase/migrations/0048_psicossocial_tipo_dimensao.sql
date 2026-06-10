-- ============================================================================
-- MIGRATION 0048 — Tipo da dimensão psicossocial (exposição vs. desfecho)
-- ============================================================================
--
-- Instrumentos como o PROART medem, além de FATORES DE RISCO (exposição), também
-- DESFECHOS (sofrimento, danos) — consequências, não fatores. Apenas as
-- dimensões de EXPOSIÇÃO alimentam o Inventário do PGR; as de DESFECHO entram
-- só como monitoramento. Esta coluna registra essa natureza por resultado.
-- ============================================================================

ALTER TABLE psi_resultado_dimensao
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'exposicao'
                            CHECK (tipo IN ('exposicao', 'desfecho'));

COMMENT ON COLUMN psi_resultado_dimensao.tipo IS
  'exposicao = fator de risco (vai ao Inventário do PGR); desfecho = consequência '
  '(sofrimento/danos/burnout) — apenas monitoramento, não lançado no PGR.';
