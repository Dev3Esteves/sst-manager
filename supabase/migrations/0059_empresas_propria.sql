-- ============================================================================
-- MIGRATION 0059 — empresas.propria (contexto operacional) + backfill
-- ============================================================================
-- "própria" = empresa que a Organização opera (contexto de isolamento/tenant,
-- switchável). Demais empresas são parceiros gerenciados (cliente, prestadora...).
-- Substitui o conceito "dona do sistema" como sinal operacional.

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS propria BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_empresas_propria ON empresas(propria) WHERE propria = true;

COMMENT ON COLUMN empresas.propria IS
  'true = empresa própria (contexto operacional que o usuário opera). false = parceiro de negócio gerenciado (cliente, prestadora, etc.).';

-- Backfill a partir dos sinais legados.
UPDATE empresas SET propria = true
WHERE propria = false AND (dona_sistema = true OR tipo = 'propria');

-- Papel 'propria' no Business Partner (mantém 'dona' até a Onda 3 / migration 0062).
ALTER TABLE empresa_papeis DROP CONSTRAINT IF EXISTS empresa_papeis_papel_check;
ALTER TABLE empresa_papeis ADD CONSTRAINT empresa_papeis_papel_check
  CHECK (papel IN ('dona','propria','cliente','prestadora','fornecedor','transportadora','parceira'));

INSERT INTO empresa_papeis (empresa_id, papel)
SELECT empresa_id, 'propria' FROM empresa_papeis WHERE papel = 'dona'
ON CONFLICT (empresa_id, papel) DO NOTHING;

-- Backfill operativo: usuários cuja empresa principal é própria ganham o vínculo
-- e a empresa ativa (aplicado ANTES do trigger guard da 0060).
INSERT INTO usuario_empresas (usuario_id, empresa_id)
SELECT u.id, u.empresa_id
FROM usuarios u
JOIN empresas e ON e.id = u.empresa_id
WHERE u.empresa_id IS NOT NULL AND e.propria = true
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

UPDATE usuarios u SET empresa_ativa_id = u.empresa_id
WHERE u.empresa_ativa_id IS NULL
  AND EXISTS (SELECT 1 FROM empresas e WHERE e.id = u.empresa_id AND e.propria = true);

-- Defensivo: reaponta empresa_ativa_id que esteja em empresa não-própria.
UPDATE usuarios u SET empresa_ativa_id = (
  SELECT ue.empresa_id FROM usuario_empresas ue
  JOIN empresas e ON e.id = ue.empresa_id
  WHERE ue.usuario_id = u.id AND e.propria = true
  ORDER BY e.created_at ASC LIMIT 1)
WHERE u.empresa_ativa_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM empresas e WHERE e.id = u.empresa_ativa_id AND e.propria = true);
