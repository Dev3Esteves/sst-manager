-- ============================================================================
-- MIGRATION 0004 — SEED: PERFIS DE ACESSO PADRÃO
-- ============================================================================

INSERT INTO perfis_acesso (nome, descricao, permissoes) VALUES
  ('admin', 'Administrador do sistema — acesso total',
    '{"all": true, "modulos": {"cadastros": {"crud": true}, "documentos": {"crud": true, "aprovar": true}, "inspecoes": {"crud": true}, "ocorrencias": {"crud": true}, "dashboard": "full", "config": "full"}}'::jsonb),

  ('tec_seguranca', 'Técnico de Segurança — operação principal',
    '{"modulos": {"cadastros": {"ler": true, "criar": true, "editar": true}, "documentos": {"ler": true, "criar": true, "editar": true}, "inspecoes": {"crud": true}, "ocorrencias": {"crud": true}, "dashboard": "full", "config": "read"}}'::jsonb),

  ('engenheiro_seg', 'Engenheiro de Segurança — aprova e analisa',
    '{"modulos": {"cadastros": {"ler": true}, "documentos": {"ler": true, "aprovar": true}, "inspecoes": {"ler": true}, "ocorrencias": {"ler": true, "aprovar": true}, "dashboard": "full", "config": "read"}}'::jsonb),

  ('encarregado_campo', 'Encarregado de Campo — preenche registros diários',
    '{"modulos": {"cadastros": {"ler": true}, "documentos": {"criar": true}, "inspecoes": {"criar": true}, "ocorrencias": {"criar": true}, "dashboard": "basico"}}'::jsonb),

  ('rh_administrativo', 'RH/Administrativo — exames e treinamentos',
    '{"modulos": {"cadastros": {"ler": true}, "exames": {"crud": true}, "treinamentos": {"crud": true}, "documentos": {"ler": true}, "ocorrencias": {"ler": true}, "dashboard": "basico"}}'::jsonb),

  ('gestor_diretoria', 'Gestor/Diretoria — visualização e KPIs',
    '{"modulos": {"cadastros": {"ler": true}, "documentos": {"ler": true}, "inspecoes": {"ler": true}, "ocorrencias": {"ler": true}, "dashboard": "full"}}'::jsonb),

  ('visualizador', 'Visualizador — somente leitura',
    '{"modulos": {"cadastros": {"ler": true}, "documentos": {"ler": true}, "inspecoes": {"ler": true}, "ocorrencias": {"ler": true}, "dashboard": "basico"}}'::jsonb)
ON CONFLICT (nome) DO NOTHING;

-- Templates de inspeção pré-configurados (seção 4.5 da spec)
INSERT INTO templates_inspecao (titulo, categoria, periodicidade, itens) VALUES
  ('Checklist Diário de Veículos', 'veiculo', 'diario',
    '[
      {"grupo": "Documentação", "pergunta": "CRLV em dia?", "tipo_resposta": "sim_nao_na"},
      {"grupo": "Documentação", "pergunta": "CNH do motorista em dia?", "tipo_resposta": "sim_nao_na"},
      {"grupo": "Pneus", "pergunta": "Pneus em condição adequada (sem desgaste excessivo)?", "tipo_resposta": "sim_nao_na", "foto_obrigatoria": true},
      {"grupo": "Freios", "pergunta": "Freios respondem adequadamente?", "tipo_resposta": "sim_nao_na"},
      {"grupo": "Iluminação", "pergunta": "Faróis, lanternas e setas funcionando?", "tipo_resposta": "sim_nao_na"},
      {"grupo": "Equipamentos", "pergunta": "Triângulo, macaco e estepe presentes?", "tipo_resposta": "sim_nao_na"},
      {"grupo": "Segurança", "pergunta": "Cintos de segurança em bom estado?", "tipo_resposta": "sim_nao_na"}
    ]'::jsonb),

  ('Inspeção de Quadros Elétricos (NR-10)', 'eletrica', 'mensal',
    '[
      {"grupo": "Identificação", "pergunta": "Quadro identificado e sinalizado?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-10"},
      {"grupo": "Identificação", "pergunta": "Circuitos identificados individualmente?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-10"},
      {"grupo": "Proteção", "pergunta": "Disjuntores e DRs em funcionamento?", "tipo_resposta": "sim_nao_na", "foto_obrigatoria": true},
      {"grupo": "Proteção", "pergunta": "Aterramento funcional verificado?", "tipo_resposta": "sim_nao_na"},
      {"grupo": "Condição", "pergunta": "Sem sinais de aquecimento ou oxidação?", "tipo_resposta": "sim_nao_na", "foto_obrigatoria": true},
      {"grupo": "Acesso", "pergunta": "Área de manobra desobstruída?", "tipo_resposta": "sim_nao_na"},
      {"grupo": "EPIs", "pergunta": "EPI para intervenção disponível no local?", "tipo_resposta": "sim_nao_na"}
    ]'::jsonb),

  ('Inspeção de EPIs', 'epi', 'mensal',
    '[
      {"grupo": "Capacete", "pergunta": "Capacete sem trincas ou deformações?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-6"},
      {"grupo": "Luvas", "pergunta": "Luvas íntegras e dentro da validade?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-6"},
      {"grupo": "Calçados", "pergunta": "Calçados de segurança em bom estado?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-6"},
      {"grupo": "Cinto/Talabarte", "pergunta": "Cinto tipo paraquedista sem avarias?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-35", "foto_obrigatoria": true},
      {"grupo": "Proteção Auditiva", "pergunta": "Protetor auricular limpo e funcional?", "tipo_resposta": "sim_nao_na"},
      {"grupo": "CA", "pergunta": "Todos os CAs dentro da validade?", "tipo_resposta": "sim_nao_na"}
    ]'::jsonb)
ON CONFLICT DO NOTHING;
