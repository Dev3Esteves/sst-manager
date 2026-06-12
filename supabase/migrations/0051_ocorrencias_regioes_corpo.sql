-- ============================================================================
-- MIGRATION 0051 — Regiões do corpo atingidas (códigos) em ocorrências
-- ============================================================================
--
-- O formulário de acidente já tem um seletor visual do corpo, mas só persistia a
-- descrição combinada em `parte_corpo_atingida` (texto). Para redesenhar o mapa do
-- corpo no PDF (frente/verso com regiões destacadas) é preciso guardar os CÓDIGOS
-- das regiões selecionadas. Esta coluna JSONB armazena o array de códigos
-- (ex.: ["mao_dir","torax"]). `parte_corpo_atingida` permanece como rótulo legível.
-- ============================================================================

ALTER TABLE ocorrencias
  ADD COLUMN IF NOT EXISTS regioes_corpo JSONB;

COMMENT ON COLUMN ocorrencias.regioes_corpo IS
  'Array JSON de códigos das regiões do corpo atingidas (ver src/lib/body-regions.ts), '
  'usado para redesenhar o mapa do corpo no PDF. parte_corpo_atingida mantém o rótulo textual.';
