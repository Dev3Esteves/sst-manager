-- ============================================================================
-- MIGRATION 0060 — Guard: usuario_empresas só aceita empresas próprias
-- ============================================================================
-- Parceiros (cliente/prestadora/...) nunca são contextos operacionais. Este
-- trigger impede vincular um usuário a uma empresa não-própria (o switcher só
-- pode operar próprias). Aplicar após a 0059 (que já normalizou os dados).

CREATE OR REPLACE FUNCTION assert_usuario_empresa_propria() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM empresas e WHERE e.id = NEW.empresa_id AND e.propria = true) THEN
    RAISE EXCEPTION 'usuario_empresas só aceita empresas próprias (empresa_id=%)', NEW.empresa_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_usuario_empresas_propria ON usuario_empresas;
CREATE TRIGGER trg_usuario_empresas_propria
  BEFORE INSERT OR UPDATE ON usuario_empresas
  FOR EACH ROW EXECUTE FUNCTION assert_usuario_empresa_propria();
