-- ============================================================================
-- MIGRATION 0057 — Remove a integração com RH externo ("People")
-- ============================================================================
-- O subsistema de integração foi removido do código (rotas /api/integr,
-- lib/integracao, página /admin/integracoes). Aqui removemos a tabela de
-- log/idempotência do webhook e neutralizamos comentários de marca no banco.

DROP TABLE IF EXISTS integr_evento CASCADE;

-- Neutraliza comentários que citavam a marca/produto antigo.
COMMENT ON TABLE pgr_acao IS
  '5W1H — Plano de Ação do PGR. Aparece no Anexo I (Cronograma Anual de Atividades) com 17 itens típicos.';

COMMENT ON COLUMN cargos.origem IS
  'Origem do cadastro do cargo (local = cadastrado no próprio SST).';
