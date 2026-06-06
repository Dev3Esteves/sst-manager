-- ============================================================================
-- MIGRATION 0027 — TRILHA DE TREINAMENTO DO SISTEMA (FASE FINAL)
-- Progresso por usuário na trilha de treinamento in-app (desbloqueio sequencial).
-- Cada usuário lê e escreve apenas o próprio progresso.
-- ============================================================================

CREATE TABLE IF NOT EXISTS treinamento_sistema_progresso (
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo_slug TEXT NOT NULL,
  concluido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, modulo_slug)
);
CREATE INDEX IF NOT EXISTS idx_treina_sis_prog_usuario ON treinamento_sistema_progresso(usuario_id);

ALTER TABLE treinamento_sistema_progresso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treina_sis_prog_select_own" ON treinamento_sistema_progresso;
CREATE POLICY "treina_sis_prog_select_own" ON treinamento_sistema_progresso
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "treina_sis_prog_write_own" ON treinamento_sistema_progresso;
CREATE POLICY "treina_sis_prog_write_own" ON treinamento_sistema_progresso
  FOR ALL TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());
