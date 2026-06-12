-- ============================================================================
-- MIGRATION 0055 — Integração People: vínculo 'ambos' + payload dos eventos
-- ============================================================================
--
-- 1) tipo_vinculo: o People envia CLT | PJ | AMBOS. O domínio do SST não tinha
--    'ambos' — adiciona ao CHECK para persistir fielmente o vínculo sincronizado.
-- 2) integr_evento.payload: guarda o `data` bruto de cada evento recebido, para
--    auditoria/depuração e para "estacionar" eventos sem handler de ação ainda
--    (ex.: aso.agendamento_solicitado), sem perder o dado.
-- ============================================================================

ALTER TABLE colaboradores DROP CONSTRAINT IF EXISTS colaboradores_tipo_vinculo_check;
ALTER TABLE colaboradores ADD CONSTRAINT colaboradores_tipo_vinculo_check
  CHECK (tipo_vinculo IN ('clt', 'pj', 'temporario', 'estagiario', 'terceiro', 'ambos'));

ALTER TABLE integr_evento ADD COLUMN IF NOT EXISTS payload JSONB;

COMMENT ON COLUMN integr_evento.payload IS
  'Cópia do data do evento recebido do People (auditoria/depuração e parking de eventos sem ação).';
