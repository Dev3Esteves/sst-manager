-- ============================================================================
-- MIGRATION 0019 — external_id: índice único TOTAL (suporte a ON CONFLICT)
-- ============================================================================
--
-- A 0018 criou índices únicos PARCIAIS em external_id (WHERE external_id IS
-- NOT NULL). O upsert do webhook usa `ON CONFLICT (external_id)` sem repetir
-- o predicado, e o Postgres não consegue inferir um índice parcial nesse caso
-- ("there is no unique or exclusion constraint matching the ON CONFLICT
-- specification"). A correção é tornar o índice TOTAL.
--
-- Seguro: no Postgres índices únicos tratam NULLs como distintos (NULLS
-- DISTINCT, default), então os registros locais (external_id NULL) continuam
-- podendo coexistir sem conflito. Apenas os valores não-nulos (origem People)
-- ficam sujeitos à unicidade — exatamente o que queremos.
-- ============================================================================

DROP INDEX IF EXISTS idx_cargos_external;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cargos_external
  ON cargos (external_id);

DROP INDEX IF EXISTS idx_colaboradores_external;
CREATE UNIQUE INDEX IF NOT EXISTS idx_colaboradores_external
  ON colaboradores (external_id);

DROP INDEX IF EXISTS idx_exames_external;
CREATE UNIQUE INDEX IF NOT EXISTS idx_exames_external
  ON exames_medicos (external_id);
