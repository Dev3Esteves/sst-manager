-- ============================================================================
-- MIGRATION 0053 — Equipe da obra (alocação por função + headcount)
-- ============================================================================
--
-- Permite ao responsável alocar a "equipe" de um contrato/obra por FUNÇÃO e
-- QUANTIDADE (sem vincular pessoas individuais). Essa equipe alimenta o PGR:
-- ao montar um GHE, é possível importar os cargos da obra e o nº de expostos
-- a partir daqui. cargo_id é opcional (link ao catálogo de cargos quando houver).
-- ============================================================================

CREATE TABLE IF NOT EXISTS obra_equipe (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  obra_id      UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  cargo_titulo TEXT NOT NULL,
  cargo_id     UUID REFERENCES cargos(id) ON DELETE SET NULL,
  quantidade   INTEGER NOT NULL DEFAULT 1 CHECK (quantidade >= 0),
  ordem        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (obra_id, cargo_titulo)
);
CREATE INDEX IF NOT EXISTS idx_obra_equipe_obra ON obra_equipe(obra_id);
CREATE INDEX IF NOT EXISTS idx_obra_equipe_empresa ON obra_equipe(empresa_id);

COMMENT ON TABLE obra_equipe IS
  'Equipe alocada na obra por função + quantidade (headcount). Alimenta o PGR '
  '(cargos do GHE e nº de expostos). Sem vínculo a pessoas individuais.';

ALTER TABLE obra_equipe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "obra_equipe_select" ON obra_equipe;
CREATE POLICY "obra_equipe_select" ON obra_equipe
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');
DROP POLICY IF EXISTS "obra_equipe_write" ON obra_equipe;
CREATE POLICY "obra_equipe_write" ON obra_equipe
  FOR ALL TO authenticated
  USING (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo'))
  WITH CHECK (empresa_id = user_empresa_id() AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo'));
