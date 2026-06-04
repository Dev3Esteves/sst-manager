-- ============================================================================
-- MIGRATION 0011 — Template de certificado por empresa (tela /configuracoes)
-- ============================================================================
--
-- Por quê:
--   O texto do certificado de treinamento hoje resolve em duas camadas:
--     1. treinamentos.texto_certificado (específico do curso, se preenchido)
--     2. TEXTO_CERTIFICADO_PADRAO (constante hardcoded no código)
--
--   Faltava uma camada intermediária editável pela organização: um template
--   PADRÃO da empresa, configurável na UI sem deploy. Esta migration adiciona
--   essa coluna na empresa-dona. A cadeia de resolução passa a ser:
--     treinamento-específico > template-da-empresa > padrão hardcoded.
--
--   Idempotente (ADD COLUMN IF NOT EXISTS) — seguro reaplicar.
-- ============================================================================

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS template_certificado text;

COMMENT ON COLUMN empresas.template_certificado IS
  'Template padrão de certificado da organização (placeholders {{var}}). '
  'NULL = usa o padrão hardcoded. Tem precedência menor que treinamentos.texto_certificado.';
