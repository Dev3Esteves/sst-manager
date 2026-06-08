-- ============================================================================
-- MIGRATION 0045 — Parceiro de Negócio: VIEWs de compatibilidade (Fase 1)
-- ============================================================================
-- Expõem o endereço/contato PRINCIPAL de cada empresa num formato achatado,
-- para o app e os geradores de PDF migrarem a leitura do JSONB para as novas
-- tabelas de forma gradual (Fase 2). Não alteram dados.
-- `security_invoker = true` faz as VIEWs respeitarem a RLS das tabelas-base.
-- ============================================================================

CREATE OR REPLACE VIEW vw_empresa_endereco_principal
  WITH (security_invoker = true) AS
SELECT DISTINCT ON (empresa_id)
  empresa_id, cep, logradouro, numero, complemento, bairro, municipio, uf
FROM empresa_enderecos
ORDER BY empresa_id, principal DESC, created_at ASC;

COMMENT ON VIEW vw_empresa_endereco_principal IS
  'Endereço principal (fallback: mais antigo) por empresa, achatado para leitura.';

CREATE OR REPLACE VIEW vw_empresa_contato_principal
  WITH (security_invoker = true) AS
SELECT DISTINCT ON (empresa_id)
  empresa_id, tipo, valor, nome_contato
FROM empresa_contatos
ORDER BY empresa_id, principal DESC, created_at ASC;

COMMENT ON VIEW vw_empresa_contato_principal IS
  'Contato principal (fallback: mais antigo) por empresa, achatado para leitura.';
