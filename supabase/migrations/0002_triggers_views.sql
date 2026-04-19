-- ============================================================================
-- MIGRATION 0002 — TRIGGERS, FUNÇÕES E VIEWS MATERIALIZADAS
-- ============================================================================

-- ============================================
-- Trigger: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_colaboradores_updated
  BEFORE UPDATE ON colaboradores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_documentos_sst_updated
  BEFORE UPDATE ON documentos_sst
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ocorrencias_updated
  BEFORE UPDATE ON ocorrencias
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Trigger: calcula data_vencimento de treinamento automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION calc_vencimento_treinamento()
RETURNS TRIGGER AS $$
DECLARE
  v_validade_meses INTEGER;
BEGIN
  SELECT validade_meses INTO v_validade_meses
  FROM treinamentos WHERE id = NEW.treinamento_id;

  IF v_validade_meses IS NOT NULL AND NEW.data_vencimento IS NULL THEN
    NEW.data_vencimento := NEW.data_realizacao + (v_validade_meses || ' months')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_treinamentos_realizados_vencimento
  BEFORE INSERT OR UPDATE ON treinamentos_realizados
  FOR EACH ROW EXECUTE FUNCTION calc_vencimento_treinamento();

-- ============================================
-- Função: atualiza status de vencimentos (cron diário)
-- ============================================
CREATE OR REPLACE FUNCTION atualizar_status_vencimentos()
RETURNS void AS $$
BEGIN
  UPDATE exames_medicos SET status = 'vencido'
  WHERE data_vencimento < CURRENT_DATE AND status = 'vigente';

  UPDATE treinamentos_realizados SET status = 'vencido'
  WHERE data_vencimento < CURRENT_DATE AND status = 'vigente';

  UPDATE documentos_sst SET status = 'vencido'
  WHERE data_validade < CURRENT_DATE AND status IN ('emitido', 'aprovado');

  REFRESH MATERIALIZED VIEW CONCURRENTLY vw_vencimentos;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- View materializada: controle de vencimentos unificado
-- ============================================
CREATE MATERIALIZED VIEW vw_vencimentos AS
SELECT
  'exame_medico'::TEXT AS categoria,
  c.nome_completo AS colaborador,
  c.id AS colaborador_id,
  c.empresa_id,
  e.tipo || COALESCE(' - ' || e.subtipo, '') AS item,
  e.data_vencimento,
  CASE
    WHEN e.data_vencimento < CURRENT_DATE THEN 'vencido'
    WHEN e.data_vencimento <= CURRENT_DATE + INTERVAL '30 days' THEN 'critico'
    WHEN e.data_vencimento <= CURRENT_DATE + INTERVAL '60 days' THEN 'alerta'
    ELSE 'regular'
  END AS urgencia,
  (e.data_vencimento - CURRENT_DATE)::INTEGER AS dias_restantes
FROM exames_medicos e
JOIN colaboradores c ON c.id = e.colaborador_id
WHERE e.status = 'vigente' AND c.status = 'ativo'

UNION ALL

SELECT
  'treinamento'::TEXT,
  c.nome_completo,
  c.id,
  c.empresa_id,
  t.titulo || ' (' || COALESCE(t.nr_referencia, 'Geral') || ')',
  tr.data_vencimento,
  CASE
    WHEN tr.data_vencimento < CURRENT_DATE THEN 'vencido'
    WHEN tr.data_vencimento <= CURRENT_DATE + INTERVAL '30 days' THEN 'critico'
    WHEN tr.data_vencimento <= CURRENT_DATE + INTERVAL '60 days' THEN 'alerta'
    ELSE 'regular'
  END,
  (tr.data_vencimento - CURRENT_DATE)::INTEGER
FROM treinamentos_realizados tr
JOIN colaboradores c ON c.id = tr.colaborador_id
JOIN treinamentos t ON t.id = tr.treinamento_id
WHERE tr.status = 'vigente' AND c.status = 'ativo' AND tr.data_vencimento IS NOT NULL

UNION ALL

SELECT
  'epi_ca'::TEXT,
  ep.descricao,
  NULL::UUID,
  NULL::UUID,
  'CA ' || ep.ca,
  ep.ca_validade,
  CASE
    WHEN ep.ca_validade < CURRENT_DATE THEN 'vencido'
    WHEN ep.ca_validade <= CURRENT_DATE + INTERVAL '30 days' THEN 'critico'
    WHEN ep.ca_validade <= CURRENT_DATE + INTERVAL '60 days' THEN 'alerta'
    ELSE 'regular'
  END,
  (ep.ca_validade - CURRENT_DATE)::INTEGER
FROM epis ep
WHERE ep.ca_validade IS NOT NULL;

CREATE UNIQUE INDEX idx_vw_vencimentos_uniq ON vw_vencimentos (categoria, colaborador_id, item);
CREATE INDEX idx_vw_vencimentos_urgencia ON vw_vencimentos (urgencia, dias_restantes);
CREATE INDEX idx_vw_vencimentos_empresa ON vw_vencimentos (empresa_id);

-- ============================================
-- Helper: retorna empresa_id do usuário autenticado (para RLS)
-- ============================================
CREATE OR REPLACE FUNCTION user_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid() AND ativo = true LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_perfil_nome()
RETURNS TEXT AS $$
  SELECT p.nome FROM usuarios u
  JOIN perfis_acesso p ON p.id = u.perfil_id
  WHERE u.id = auth.uid() AND u.ativo = true LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
