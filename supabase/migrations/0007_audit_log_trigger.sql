-- ============================================================================
-- MIGRATION 0007 — Audit log automático (compliance LGPD Art. 37)
-- ============================================================================

-- Function genérica — captura INSERT/UPDATE/DELETE e grava em audit_log
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_registro_id UUID;
  v_dados_anteriores JSONB;
  v_dados_novos JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_registro_id := OLD.id;
    v_dados_anteriores := to_jsonb(OLD);
    v_dados_novos := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_registro_id := NEW.id;
    v_dados_anteriores := to_jsonb(OLD);
    v_dados_novos := to_jsonb(NEW);
  ELSE -- INSERT
    v_registro_id := NEW.id;
    v_dados_anteriores := NULL;
    v_dados_novos := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_log (tabela, registro_id, acao, usuario_id, dados_anteriores, dados_novos)
  VALUES (
    TG_TABLE_NAME,
    v_registro_id,
    TG_OP,
    auth.uid(),
    v_dados_anteriores,
    v_dados_novos
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach em tabelas sensíveis (dados pessoais + operacionais críticos)
CREATE TRIGGER audit_colaboradores
  AFTER INSERT OR UPDATE OR DELETE ON colaboradores
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_exames_medicos
  AFTER INSERT OR UPDATE OR DELETE ON exames_medicos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_treinamentos_realizados
  AFTER INSERT OR UPDATE OR DELETE ON treinamentos_realizados
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_documentos_sst
  AFTER INSERT OR UPDATE OR DELETE ON documentos_sst
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_ocorrencias
  AFTER INSERT OR UPDATE OR DELETE ON ocorrencias
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_inspecoes
  AFTER INSERT OR UPDATE OR DELETE ON inspecoes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_epi_entregas
  AFTER INSERT OR UPDATE OR DELETE ON epi_entregas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_usuarios
  AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
