-- ============================================================================
-- MIGRATION 0049 — Nível de severidade nativo de instrumentos de desfecho
-- ============================================================================
--
-- Instrumentos de DESFECHO (ex.: DASS-21) usam classificação nativa em 5 níveis
-- por subescala (normal/leve/moderado/severo/extremamente_severo), que não cabe
-- no campo `classificacao` (verde/amarelo/vermelho, usado para a cor). Esta
-- coluna guarda o rótulo de severidade nativo do instrumento. NULL para
-- instrumentos que não têm nível nativo (COPSOQ/HSE/PROART/CBI).
-- ============================================================================

ALTER TABLE psi_resultado_dimensao
  ADD COLUMN IF NOT EXISTS nivel_desfecho TEXT;

COMMENT ON COLUMN psi_resultado_dimensao.nivel_desfecho IS
  'Rótulo de severidade nativo de instrumentos de desfecho (ex.: DASS-21: '
  'normal/leve/moderado/severo/extremamente_severo). NULL quando não se aplica.';
