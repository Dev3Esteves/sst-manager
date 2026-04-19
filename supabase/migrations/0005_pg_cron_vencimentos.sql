-- ============================================================================
-- MIGRATION 0005 — pg_cron para atualização diária de vencimentos
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Agenda atualização diária às 03:00 UTC (00:00 São Paulo BRT)
SELECT cron.schedule(
  'sst-atualizar-vencimentos',
  '0 3 * * *',
  $$ SELECT atualizar_status_vencimentos(); $$
);

-- Também roda 1x agora para refresh inicial
SELECT atualizar_status_vencimentos();
