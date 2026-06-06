-- ============================================================================
-- MIGRATION 0030 — GESTÃO DE MUDANÇA: dimensão humana (ADKAR/HCMBOK)
-- Complementa o MOC (8.1.3) com o plano de gestão da mudança nas PESSOAS,
-- estruturado pelo modelo ADKAR (Awareness, Desire, Knowledge, Ability,
-- Reinforcement) — endereça o engajamento e a resistência citados na 8.1.3.
-- ============================================================================

ALTER TABLE gestao_mudanca
  ADD COLUMN IF NOT EXISTS adkar_consciencia TEXT,   -- Awareness: por que mudar (comunicação)
  ADD COLUMN IF NOT EXISTS adkar_desejo TEXT,        -- Desire: patrocínio e engajamento
  ADD COLUMN IF NOT EXISTS adkar_conhecimento TEXT,  -- Knowledge: treinamento/capacitação
  ADD COLUMN IF NOT EXISTS adkar_habilidade TEXT,    -- Ability: capacidade de executar
  ADD COLUMN IF NOT EXISTS adkar_reforco TEXT;       -- Reinforcement: sustentação/adoção
