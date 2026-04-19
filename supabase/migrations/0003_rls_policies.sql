-- ============================================================================
-- MIGRATION 0003 — ROW LEVEL SECURITY (RLS)
-- CRÍTICO: policies sem "TO anon" — só authenticated (lição do projeto Ouvidoria)
-- ============================================================================

-- Habilita RLS em todas as tabelas de domínio
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos_realizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE epis ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_sst ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_inspecao ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EMPRESAS — usuário vê só sua empresa; admin vê todas
-- ============================================
CREATE POLICY "empresas_select" ON empresas
  FOR SELECT TO authenticated
  USING (
    id = user_empresa_id() OR user_perfil_nome() = 'admin'
  );

CREATE POLICY "empresas_admin_all" ON empresas
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ============================================
-- CARGOS
-- ============================================
CREATE POLICY "cargos_select" ON cargos
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

CREATE POLICY "cargos_write" ON cargos
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca')
  );

-- ============================================
-- COLABORADORES
-- ============================================
CREATE POLICY "colaboradores_select" ON colaboradores
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

CREATE POLICY "colaboradores_write" ON colaboradores
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  );

-- ============================================
-- EXAMES MÉDICOS — via join com colaborador
-- ============================================
CREATE POLICY "exames_select" ON exames_medicos
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND (c.empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin'))
  );

CREATE POLICY "exames_write" ON exames_medicos
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND c.empresa_id = user_empresa_id())
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND c.empresa_id = user_empresa_id())
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  );

-- ============================================
-- TREINAMENTOS (catálogo — global; realizados — por colaborador)
-- ============================================
CREATE POLICY "treinamentos_select_all" ON treinamentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "treinamentos_write_admin" ON treinamentos
  FOR ALL TO authenticated
  USING (user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "treinamentos_realizados_select" ON treinamentos_realizados
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND (c.empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin'))
  );

CREATE POLICY "treinamentos_realizados_write" ON treinamentos_realizados
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND c.empresa_id = user_empresa_id())
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND c.empresa_id = user_empresa_id())
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'rh_administrativo')
  );

-- ============================================
-- EPIs e entregas
-- ============================================
CREATE POLICY "epis_select_all" ON epis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "epis_write" ON epis
  FOR ALL TO authenticated
  USING (user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "epi_entregas_select" ON epi_entregas
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND (c.empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin'))
  );

CREATE POLICY "epi_entregas_write" ON epi_entregas
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND c.empresa_id = user_empresa_id())
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'encarregado_campo')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = colaborador_id
      AND c.empresa_id = user_empresa_id())
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'encarregado_campo')
  );

-- ============================================
-- DOCUMENTOS SST
-- ============================================
CREATE POLICY "docs_select" ON documentos_sst
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

CREATE POLICY "docs_write" ON documentos_sst
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo')
  );

-- ============================================
-- OCORRÊNCIAS
-- ============================================
CREATE POLICY "ocorrencias_select" ON ocorrencias
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

CREATE POLICY "ocorrencias_write" ON ocorrencias
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg', 'encarregado_campo')
  );

-- ============================================
-- TEMPLATES E INSPEÇÕES
-- ============================================
CREATE POLICY "templates_inspecao_select_all" ON templates_inspecao
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "templates_inspecao_write" ON templates_inspecao
  FOR ALL TO authenticated
  USING (user_perfil_nome() IN ('admin', 'tec_seguranca'))
  WITH CHECK (user_perfil_nome() IN ('admin', 'tec_seguranca'));

CREATE POLICY "inspecoes_select" ON inspecoes
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

CREATE POLICY "inspecoes_write" ON inspecoes
  FOR ALL TO authenticated
  USING (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'encarregado_campo')
  )
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_perfil_nome() IN ('admin', 'tec_seguranca', 'encarregado_campo')
  );

-- ============================================
-- PERFIS E USUÁRIOS (só admin)
-- ============================================
CREATE POLICY "perfis_acesso_select_all" ON perfis_acesso
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "perfis_acesso_admin" ON perfis_acesso
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

CREATE POLICY "usuarios_self" ON usuarios
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR user_perfil_nome() = 'admin');

CREATE POLICY "usuarios_admin" ON usuarios
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ============================================
-- AUDIT LOG — só leitura para admin
-- ============================================
CREATE POLICY "audit_log_admin_read" ON audit_log
  FOR SELECT TO authenticated
  USING (user_perfil_nome() = 'admin');
