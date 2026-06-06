-- ============================================================================
-- MIGRATION 0021 — TEMPLATES PRÉ-CONFIGURADOS (Fase 1.3 / 1.4)
--   • Novos templates de INSPEÇÃO (Alojamento, Ferramentas/Equipamentos)
--   • Nova tabela `templates_ocorrencia` (catálogo global) + seed
-- Catálogos globais (sem empresa_id) — compartilhados pelo grupo, como
-- `templates_inspecao`. Escrita restrita a admin/tec_seguranca/engenheiro_seg.
-- Todos os INSERTs são idempotentes (WHERE NOT EXISTS por título).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED — novos templates de inspeção
-- ----------------------------------------------------------------------------
INSERT INTO templates_inspecao (titulo, categoria, periodicidade, itens)
SELECT 'Inspeção de Alojamento', 'alojamento', 'mensal',
  '[
    {"grupo": "Instalações Sanitárias", "pergunta": "Sanitários em quantidade suficiente e higienizados?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-24"},
    {"grupo": "Instalações Sanitárias", "pergunta": "Chuveiros com água quente e em funcionamento?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-24"},
    {"grupo": "Dormitórios", "pergunta": "Camas individuais, com colchão e roupa de cama limpa?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-24", "foto_obrigatoria": true},
    {"grupo": "Dormitórios", "pergunta": "Ventilação e iluminação adequadas?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-24"},
    {"grupo": "Dormitórios", "pergunta": "Armários individuais disponíveis?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-24"},
    {"grupo": "Cozinha/Refeitório", "pergunta": "Local de refeições limpo e arejado?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-24"},
    {"grupo": "Cozinha/Refeitório", "pergunta": "Geladeira/armazenamento de alimentos adequado?", "tipo_resposta": "sim_nao_na"},
    {"grupo": "Limpeza", "pergunta": "Coleta de lixo regular e recipientes com tampa?", "tipo_resposta": "sim_nao_na"},
    {"grupo": "Segurança", "pergunta": "Extintores e saídas de emergência sinalizados?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-23"},
    {"grupo": "Elétrica", "pergunta": "Instalações elétricas sem improvisos/sobrecarga?", "tipo_resposta": "sim_nao_na", "foto_obrigatoria": true}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM templates_inspecao WHERE titulo = 'Inspeção de Alojamento');

INSERT INTO templates_inspecao (titulo, categoria, periodicidade, itens)
SELECT 'Inspeção de Ferramentas e Equipamentos', 'ferramentas', 'mensal',
  '[
    {"grupo": "Ferramentas Manuais", "pergunta": "Cabos firmes, sem trincas ou rachaduras?", "tipo_resposta": "sim_nao_na", "foto_obrigatoria": true},
    {"grupo": "Ferramentas Manuais", "pergunta": "Sem improvisos ou adaptações inseguras?", "tipo_resposta": "sim_nao_na"},
    {"grupo": "Ferramentas Elétricas", "pergunta": "Cabos e plugues íntegros (sem emendas)?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-12", "foto_obrigatoria": true},
    {"grupo": "Ferramentas Elétricas", "pergunta": "Protetores e dispositivos de segurança presentes?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-12"},
    {"grupo": "Ferramentas Elétricas", "pergunta": "Duplo isolamento ou aterramento verificado?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-10"},
    {"grupo": "Equipamentos", "pergunta": "Identificação/etiqueta de inspeção dentro da validade?", "tipo_resposta": "sim_nao_na"},
    {"grupo": "Equipamentos", "pergunta": "Partes móveis com proteção (enclausuramento)?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-12"},
    {"grupo": "Equipamentos", "pergunta": "Botão de emergência (quando aplicável) funcional?", "tipo_resposta": "sim_nao_na", "nr_referencia": "NR-12"},
    {"grupo": "Armazenamento", "pergunta": "Ferramentas guardadas em local apropriado e organizado?", "tipo_resposta": "sim_nao_na"},
    {"grupo": "Geral", "pergunta": "Equipamento adequado à tarefa (ferramenta certa para o serviço)?", "tipo_resposta": "sim_nao_na"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM templates_inspecao WHERE titulo = 'Inspeção de Ferramentas e Equipamentos');

-- ----------------------------------------------------------------------------
-- 2. TABELA — templates de ocorrência (catálogo global)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS templates_ocorrencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'acidente_tipico', 'acidente_trajeto', 'doenca_ocupacional',
    'quase_acidente', 'incidente', 'condicao_insegura', 'ato_inseguro',
    'desvio', 'emergencia'
  )),
  titulo TEXT NOT NULL,
  descricao_modelo TEXT,                       -- roteiro pré-preenchido na descrição
  gravidade_sugerida TEXT CHECK (gravidade_sugerida IN ('leve', 'moderado', 'grave', 'fatal')),
  natureza_lesao_sugerida TEXT,
  agente_causador_sugerido TEXT,
  roteiro_investigacao JSONB,                  -- perguntas-guia (array de string)
  is_sistema BOOLEAN DEFAULT false,            -- veio do seed → pode reverter ao padrão
  padrao JSONB,                                -- snapshot de fábrica (para "reverter ao padrão")
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE templates_ocorrencia ENABLE ROW LEVEL SECURITY;

-- Leitura global (todos os usuários autenticados); escrita restrita a SST.
DROP POLICY IF EXISTS "templates_ocorrencia_select_all" ON templates_ocorrencia;
CREATE POLICY "templates_ocorrencia_select_all" ON templates_ocorrencia
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "templates_ocorrencia_write" ON templates_ocorrencia;
CREATE POLICY "templates_ocorrencia_write" ON templates_ocorrencia
  FOR ALL TO authenticated
  USING (user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'))
  WITH CHECK (user_perfil_nome() IN ('admin', 'tec_seguranca', 'engenheiro_seg'));

-- ----------------------------------------------------------------------------
-- 3. SEED — templates de ocorrência padrão (is_sistema = true)
--    `padrao` guarda o snapshot dos campos editáveis para "reverter ao padrão".
-- ----------------------------------------------------------------------------
INSERT INTO templates_ocorrencia (tipo, titulo, descricao_modelo, gravidade_sugerida, natureza_lesao_sugerida, agente_causador_sugerido, roteiro_investigacao, is_sistema, padrao)
SELECT v.tipo, v.titulo, v.descricao_modelo, v.gravidade_sugerida, v.natureza_lesao_sugerida, v.agente_causador_sugerido, v.roteiro_investigacao, true,
  jsonb_build_object(
    'titulo', v.titulo,
    'descricao_modelo', v.descricao_modelo,
    'gravidade_sugerida', v.gravidade_sugerida,
    'natureza_lesao_sugerida', v.natureza_lesao_sugerida,
    'agente_causador_sugerido', v.agente_causador_sugerido,
    'roteiro_investigacao', v.roteiro_investigacao
  )
FROM (VALUES
  ('quase_acidente', 'Quase acidente',
   E'DESCRIÇÃO DO QUASE ACIDENTE\n• O que aconteceu (situação que quase resultou em lesão/dano):\n• Onde / quando:\n• Quem estava envolvido / presente:\n• O que evitou que o acidente acontecesse:\n• Ação imediata adotada:',
   NULL::text, NULL::text, NULL::text,
   '["Por que a situação de risco ocorreu?","Por que o controle existente não foi suficiente?","Por que o risco não havia sido identificado antes?","Por que o procedimento (se existe) não foi seguido?","Qual a causa-raiz e o que evita a reincidência?"]'::jsonb),

  ('acidente_tipico', 'Acidente típico (com lesão)',
   E'DESCRIÇÃO DO ACIDENTE\n• Atividade que estava sendo executada:\n• Como ocorreu (sequência dos fatos):\n• Parte do corpo atingida / tipo de lesão:\n• Atendimento prestado (primeiros socorros/encaminhamento):\n• EPI em uso no momento:\n• Testemunhas:',
   'moderado', 'A definir (corte, contusão, fratura...)', 'A definir',
   '["Por que o trabalhador foi exposto ao agente causador?","Por que a proteção/EPI não evitou a lesão?","Por que a condição/ato inseguro existia?","Por que não foi detectado na inspeção/APR?","Qual a causa-raiz organizacional?"]'::jsonb),

  ('condicao_insegura', 'Condição insegura',
   E'DESCRIÇÃO DA CONDIÇÃO INSEGURA\n• Condição identificada (o que está errado no ambiente/equipamento):\n• Local exato:\n• Risco potencial (o que pode acontecer):\n• Foi isolada/sinalizada? Como:\n• Ação imediata e responsável:',
   NULL::text, NULL::text, NULL::text,
   '["Por que a condição insegura surgiu?","Por que não foi detectada antes?","Por que a manutenção/controle falhou?","Por que o risco não estava mapeado no PGR?","Qual a causa-raiz e a ação definitiva?"]'::jsonb),

  ('ato_inseguro', 'Ato inseguro',
   E'DESCRIÇÃO DO ATO INSEGURO\n• Comportamento observado:\n• Quem / função (sem caráter punitivo — foco em aprendizado):\n• Atividade em execução:\n• Risco associado ao ato:\n• Orientação dada na hora:',
   NULL::text, NULL::text, NULL::text,
   '["Por que o trabalhador agiu dessa forma?","Por que faltou conhecimento/treinamento (se for o caso)?","Por que o procedimento seguro não foi usado?","Por que não havia supervisão/barreira?","Qual a causa-raiz comportamental/organizacional?"]'::jsonb),

  ('incidente', 'Incidente (dano material, sem lesão)',
   E'DESCRIÇÃO DO INCIDENTE\n• O que foi danificado (equipamento/material/patrimônio):\n• Como ocorreu:\n• Houve risco a pessoas? Qual:\n• Prejuízo estimado / paralisação:\n• Ação imediata:',
   NULL::text, NULL::text, NULL::text,
   '["Por que o dano ocorreu?","Por que o controle/proteção falhou?","Por que não foi previsto?","Por que a manutenção/operação não evitou?","Qual a causa-raiz?"]'::jsonb),

  ('emergencia', 'Emergência (incêndio, vazamento, etc.)',
   E'DESCRIÇÃO DA EMERGÊNCIA\n• Tipo de emergência (incêndio, vazamento, desabamento...):\n• Local e horário:\n• Como foi acionado o atendimento (brigada/SAMU/bombeiros):\n• Pessoas afetadas / evacuação:\n• Recursos utilizados (extintores, kit, etc.):\n• Situação controlada às:',
   'grave', NULL::text, NULL::text,
   '["Por que a emergência ocorreu?","Por que as barreiras de prevenção falharam?","Por que a detecção/alarme demorou (se demorou)?","Por que o plano de resposta teve falhas (se teve)?","Qual a causa-raiz e melhoria do plano de emergência?"]'::jsonb)
) AS v(tipo, titulo, descricao_modelo, gravidade_sugerida, natureza_lesao_sugerida, agente_causador_sugerido, roteiro_investigacao)
WHERE NOT EXISTS (SELECT 1 FROM templates_ocorrencia t WHERE t.titulo = v.titulo);
