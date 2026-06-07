-- ============================================================================
-- MIGRATION 0039 — TRAVA DE TREINAMENTO (treinamento-antes-de-usar)
-- O usuário precisa concluir o treinamento de um módulo para liberar o seu uso.
--   * treinamento_config  : configuração global (linha única) da trava.
--   * treinamento_isencao : usuários isentos (por módulo ou de tudo via '*').
-- Decisões: escopo = todos os módulos · carência (não bloqueia por N dias após a
-- ativação) · isenção por usuário · admin/master nunca bloqueado.
-- Progresso já existe em treinamento_sistema_progresso (mig 0027).
-- ============================================================================

-- ── Config global (linha única forçada por id=true) ─────────────────────────
CREATE TABLE IF NOT EXISTS treinamento_config (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  trava_ativa BOOLEAN NOT NULL DEFAULT false,
  carencia_dias INTEGER NOT NULL DEFAULT 7 CHECK (carencia_dias >= 0),
  data_ativacao TIMESTAMPTZ,      -- setada quando a trava é ligada; base da carência
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO treinamento_config (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE treinamento_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treina_config_select" ON treinamento_config;
CREATE POLICY "treina_config_select" ON treinamento_config
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "treina_config_write" ON treinamento_config;
CREATE POLICY "treina_config_write" ON treinamento_config
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ── Isenções por usuário ('*' = isento de todos os módulos) ─────────────────
CREATE TABLE IF NOT EXISTS treinamento_isencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo_slug TEXT NOT NULL DEFAULT '*',
  motivo TEXT,
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_treina_isencao ON treinamento_isencao(usuario_id, modulo_slug);

ALTER TABLE treinamento_isencao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treina_isencao_select" ON treinamento_isencao;
CREATE POLICY "treina_isencao_select" ON treinamento_isencao
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "treina_isencao_write" ON treinamento_isencao;
CREATE POLICY "treina_isencao_write" ON treinamento_isencao
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ── Resolvedor de status (1 round-trip para o middleware) ───────────────────
-- Retorna 'livre' | 'carencia' | 'bloqueado' para o usuário autenticado e um
-- slug de módulo, considerando: trava global, admin imune, conclusão, isenção
-- e carência. SECURITY DEFINER para ler config/isenção de forma uniforme;
-- usa auth.uid() (claim do JWT), então continua específico do chamador.
CREATE OR REPLACE FUNCTION treinamento_status_modulo(p_slug text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg treinamento_config%ROWTYPE;
  v_fim timestamptz;
BEGIN
  SELECT * INTO v_cfg FROM treinamento_config WHERE id LIMIT 1;
  IF v_cfg.id IS NULL OR NOT v_cfg.trava_ativa THEN RETURN 'livre'; END IF;
  IF user_perfil_nome() = 'admin' THEN RETURN 'livre'; END IF;
  IF EXISTS (SELECT 1 FROM treinamento_sistema_progresso
             WHERE usuario_id = auth.uid() AND modulo_slug = p_slug) THEN
    RETURN 'livre';
  END IF;
  IF EXISTS (SELECT 1 FROM treinamento_isencao
             WHERE usuario_id = auth.uid() AND modulo_slug IN ('*', p_slug)) THEN
    RETURN 'livre';
  END IF;
  IF v_cfg.data_ativacao IS NOT NULL AND v_cfg.carencia_dias > 0 THEN
    v_fim := v_cfg.data_ativacao + (v_cfg.carencia_dias || ' days')::interval;
    IF now() < v_fim THEN RETURN 'carencia'; END IF;
  END IF;
  RETURN 'bloqueado';
END;
$$;
GRANT EXECUTE ON FUNCTION treinamento_status_modulo(text) TO authenticated;
