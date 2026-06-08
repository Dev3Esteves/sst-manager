-- ============================================================================
-- DEPLOY CONSOLIDADO — Empresas Business Partner (Fases 1 e 2)
-- Migrations 0040..0046 na ordem. Aditivo e idempotente.
-- Aplicar no Supabase Dashboard > SQL Editor (roda como admin; RLS não bloqueia).
-- Requer Postgres 15+ (views com security_invoker na 0045).
-- ============================================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>> 0040_empresa_papeis.sql <<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- ============================================================================
-- MIGRATION 0040 — Parceiro de Negócio: PAPÉIS (Fase 1 / expand)
-- ============================================================================
-- Substitui (sem remover) o `empresas.tipo` rígido por papéis N por empresa,
-- inspirado no Business Partner do SAP / accounts do Oracle TCA. Uma mesma
-- empresa pode ser cliente E prestadora ao mesmo tempo.
-- Aditiva e idempotente: NÃO altera `empresas`; `tipo` segue válido nesta fase.
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_papeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  papel TEXT NOT NULL CHECK (papel IN ('dona', 'cliente', 'prestadora', 'fornecedor', 'transportadora', 'parceira')),
  dados JSONB,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, papel)
);
CREATE INDEX IF NOT EXISTS idx_empresa_papeis_empresa ON empresa_papeis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_papeis_papel ON empresa_papeis(papel) WHERE ativo;

COMMENT ON TABLE empresa_papeis IS
  'Papéis de negócio de cada empresa (Business Partner). N papéis por empresa. '
  'Substitui o campo único empresas.tipo (deprecado na Fase 1).';

ALTER TABLE empresa_papeis ENABLE ROW LEVEL SECURITY;

-- Espelha as policies de `empresas`: leitura da empresa ativa (ou admin),
-- escrita admin-only (editar cadastro de empresa é admin-only no sistema).
DROP POLICY IF EXISTS "empresa_papeis_select" ON empresa_papeis;
CREATE POLICY "empresa_papeis_select" ON empresa_papeis
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "empresa_papeis_admin_all" ON empresa_papeis;
CREATE POLICY "empresa_papeis_admin_all" ON empresa_papeis
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- Backfill (idempotente)
-- ----------------------------------------------------------------------------
-- 1) tipo atual -> papel equivalente
INSERT INTO empresa_papeis (empresa_id, papel)
SELECT id, CASE tipo
             WHEN 'propria'     THEN 'dona'
             WHEN 'contratante' THEN 'cliente'
             WHEN 'terceira'    THEN 'prestadora'
           END
FROM empresas
WHERE tipo IN ('propria', 'contratante', 'terceira')
ON CONFLICT (empresa_id, papel) DO NOTHING;

-- 2) toda empresa marcada como dona do sistema também tem o papel 'dona'
INSERT INTO empresa_papeis (empresa_id, papel)
SELECT id, 'dona'
FROM empresas
WHERE dona_sistema = true
ON CONFLICT (empresa_id, papel) DO NOTHING;

-- 3) toda empresa usada como contratante de obra ganha o papel 'cliente'
INSERT INTO empresa_papeis (empresa_id, papel)
SELECT DISTINCT contratante_id, 'cliente'
FROM obras
WHERE contratante_id IS NOT NULL
ON CONFLICT (empresa_id, papel) DO NOTHING;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>> 0041_empresa_enderecos.sql <<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- ============================================================================
-- MIGRATION 0041 — Parceiro de Negócio: ENDEREÇOS (Fase 1 / expand)
-- ============================================================================
-- Endereços 1:N tipados (sede/filial/cobranca/obra/entrega), no máximo 1
-- principal por empresa. Backfill do JSONB `empresas.endereco` como sede
-- principal. Aditiva e idempotente: não remove `empresas.endereco` (deprecado).
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'sede' CHECK (tipo IN ('sede', 'filial', 'cobranca', 'obra', 'entrega')),
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  municipio TEXT,
  uf CHAR(2),
  principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_empresa_enderecos_empresa ON empresa_enderecos(empresa_id);
-- No máximo um endereço principal por empresa.
CREATE UNIQUE INDEX IF NOT EXISTS uq_empresa_endereco_principal
  ON empresa_enderecos(empresa_id) WHERE principal;

COMMENT ON TABLE empresa_enderecos IS
  'Endereços de cada empresa (Business Partner), 1:N tipados. Substitui o JSONB '
  'empresas.endereco (deprecado na Fase 1).';

CREATE TRIGGER trg_empresa_enderecos_updated
  BEFORE UPDATE ON empresa_enderecos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE empresa_enderecos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_enderecos_select" ON empresa_enderecos;
CREATE POLICY "empresa_enderecos_select" ON empresa_enderecos
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "empresa_enderecos_admin_all" ON empresa_enderecos;
CREATE POLICY "empresa_enderecos_admin_all" ON empresa_enderecos
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- Backfill do JSONB empresas.endereco (idempotente via NOT EXISTS)
-- ----------------------------------------------------------------------------
INSERT INTO empresa_enderecos (empresa_id, tipo, cep, logradouro, numero, complemento, bairro, municipio, uf, principal)
SELECT e.id, 'sede',
       e.endereco->>'cep',
       e.endereco->>'logradouro',
       e.endereco->>'numero',
       e.endereco->>'complemento',
       e.endereco->>'bairro',
       e.endereco->>'municipio',
       NULLIF(left(e.endereco->>'uf', 2), ''),
       true
FROM empresas e
WHERE e.endereco IS NOT NULL
  AND COALESCE(e.endereco->>'cep', e.endereco->>'logradouro', e.endereco->>'municipio') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM empresa_enderecos x WHERE x.empresa_id = e.id AND x.tipo = 'sede'
  );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>> 0042_empresa_contatos.sql <<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- ============================================================================
-- MIGRATION 0042 — Parceiro de Negócio: CONTATOS (Fase 1 / expand)
-- ============================================================================
-- Contatos 1:N (telefone/celular/email/pessoa) com no máximo 1 principal.
-- Backfill de `empresas.telefones->>'principal'`. Aditiva e idempotente:
-- não remove `empresas.telefones` (deprecado na Fase 1).
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL DEFAULT user_empresa_id() REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('telefone', 'celular', 'email', 'pessoa')),
  valor TEXT,
  nome_contato TEXT,
  cargo_contato TEXT,
  principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_empresa_contatos_empresa ON empresa_contatos(empresa_id);

COMMENT ON TABLE empresa_contatos IS
  'Contatos de cada empresa (Business Partner), 1:N. Substitui o JSONB '
  'empresas.telefones (deprecado na Fase 1).';

CREATE TRIGGER trg_empresa_contatos_updated
  BEFORE UPDATE ON empresa_contatos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE empresa_contatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_contatos_select" ON empresa_contatos;
CREATE POLICY "empresa_contatos_select" ON empresa_contatos
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "empresa_contatos_admin_all" ON empresa_contatos;
CREATE POLICY "empresa_contatos_admin_all" ON empresa_contatos
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- Backfill (idempotente)
-- ----------------------------------------------------------------------------
INSERT INTO empresa_contatos (empresa_id, tipo, valor, principal)
SELECT e.id, 'telefone', e.telefones->>'principal', true
FROM empresas e
WHERE NULLIF(trim(e.telefones->>'principal'), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM empresa_contatos x WHERE x.empresa_id = e.id AND x.tipo = 'telefone'
  );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>> 0043_empresa_fiscal.sql <<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- ============================================================================
-- MIGRATION 0043 — Parceiro de Negócio: BLOCO FISCAL (Fase 1 / expand)
-- ============================================================================
-- Dados fiscais estruturados 1:1 com a empresa. Tabela separada (não colunas)
-- para manter `empresas` enxuta — é a tabela mais referenciada do sistema.
-- `inscricao_estadual` permanece em `empresas` nesta fase. Sem backfill (não há
-- dados de origem). Aditiva e idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_fiscal (
  empresa_id UUID PRIMARY KEY REFERENCES empresas(id) ON DELETE CASCADE,
  inscricao_municipal TEXT,
  cnae_principal VARCHAR(10),
  regime_tributario TEXT CHECK (regime_tributario IN ('simples', 'lucro_presumido', 'lucro_real', 'mei', 'isento')),
  situacao_cadastral TEXT CHECK (situacao_cadastral IN ('ativa', 'suspensa', 'inapta', 'baixada', 'nula')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE empresa_fiscal IS
  'Dados fiscais 1:1 da empresa (CNAE, regime tributário, inscrição municipal, '
  'situação cadastral). inscricao_estadual permanece em empresas na Fase 1.';

CREATE TRIGGER trg_empresa_fiscal_updated
  BEFORE UPDATE ON empresa_fiscal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE empresa_fiscal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_fiscal_select" ON empresa_fiscal;
CREATE POLICY "empresa_fiscal_select" ON empresa_fiscal
  FOR SELECT TO authenticated
  USING (empresa_id = user_empresa_id() OR user_perfil_nome() = 'admin');

DROP POLICY IF EXISTS "empresa_fiscal_admin_all" ON empresa_fiscal;
CREATE POLICY "empresa_fiscal_admin_all" ON empresa_fiscal
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>> 0044_empresa_relacionamentos.sql <<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- ============================================================================
-- MIGRATION 0044 — Parceiro de Negócio: RELACIONAMENTOS (Fase 1 / expand)
-- ============================================================================
-- Relacionamentos N:N entre empresas (origem -> destino, tipado). Generaliza
-- `empresas.empresa_mae_id` (mantido/deprecado nesta fase) e reflete a relação
-- `obras.contratante_id` (cliente_de). Aditiva e idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS empresa_relacionamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_origem_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  empresa_destino_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_relacao TEXT NOT NULL CHECK (tipo_relacao IN ('matriz_filial', 'cliente_de', 'fornecedor_de', 'prestadora_de', 'grupo')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT empresa_rel_origem_destino_diff CHECK (empresa_origem_id <> empresa_destino_id),
  UNIQUE (empresa_origem_id, empresa_destino_id, tipo_relacao)
);
CREATE INDEX IF NOT EXISTS idx_empresa_rel_origem ON empresa_relacionamentos(empresa_origem_id);
CREATE INDEX IF NOT EXISTS idx_empresa_rel_destino ON empresa_relacionamentos(empresa_destino_id);

COMMENT ON TABLE empresa_relacionamentos IS
  'Relacionamentos N:N entre empresas (Business Partner). Generaliza '
  'empresas.empresa_mae_id e reflete o contratante de obras.';

ALTER TABLE empresa_relacionamentos ENABLE ROW LEVEL SECURITY;

-- Relacionamento visível aos dois lados (ou admin); escrita admin-only.
DROP POLICY IF EXISTS "empresa_rel_select" ON empresa_relacionamentos;
CREATE POLICY "empresa_rel_select" ON empresa_relacionamentos
  FOR SELECT TO authenticated
  USING (
    empresa_origem_id = user_empresa_id()
    OR empresa_destino_id = user_empresa_id()
    OR user_perfil_nome() = 'admin'
  );

DROP POLICY IF EXISTS "empresa_rel_admin_all" ON empresa_relacionamentos;
CREATE POLICY "empresa_rel_admin_all" ON empresa_relacionamentos
  FOR ALL TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ----------------------------------------------------------------------------
-- Backfill (idempotente)
-- ----------------------------------------------------------------------------
-- 1) empresa_mae_id -> vínculo de grupo (origem = empresa; destino = mãe)
INSERT INTO empresa_relacionamentos (empresa_origem_id, empresa_destino_id, tipo_relacao)
SELECT id, empresa_mae_id, 'grupo'
FROM empresas
WHERE empresa_mae_id IS NOT NULL AND empresa_mae_id <> id
ON CONFLICT (empresa_origem_id, empresa_destino_id, tipo_relacao) DO NOTHING;

-- 2) contratante de obra -> cliente_de (origem = empresa dona; destino = contratante)
INSERT INTO empresa_relacionamentos (empresa_origem_id, empresa_destino_id, tipo_relacao)
SELECT DISTINCT empresa_id, contratante_id, 'cliente_de'
FROM obras
WHERE contratante_id IS NOT NULL AND contratante_id <> empresa_id
ON CONFLICT (empresa_origem_id, empresa_destino_id, tipo_relacao) DO NOTHING;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>> 0045_empresa_bp_views_compat.sql <<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- ============================================================================
-- MIGRATION 0045 — Parceiro de Negócio: VIEWs de compatibilidade (Fase 1)
-- ============================================================================
-- Expõem o endereço/contato PRINCIPAL de cada empresa num formato achatado,
-- para o app e os geradores de PDF migrarem a leitura do JSONB para as novas
-- tabelas de forma gradual (Fase 2). Não alteram dados.
-- `security_invoker = true` faz as VIEWs respeitarem a RLS das tabelas-base.
-- ============================================================================

CREATE OR REPLACE VIEW vw_empresa_endereco_principal
  WITH (security_invoker = true) AS
SELECT DISTINCT ON (empresa_id)
  empresa_id, cep, logradouro, numero, complemento, bairro, municipio, uf
FROM empresa_enderecos
ORDER BY empresa_id, principal DESC, created_at ASC;

COMMENT ON VIEW vw_empresa_endereco_principal IS
  'Endereço principal (fallback: mais antigo) por empresa, achatado para leitura.';

CREATE OR REPLACE VIEW vw_empresa_contato_principal
  WITH (security_invoker = true) AS
SELECT DISTINCT ON (empresa_id)
  empresa_id, tipo, valor, nome_contato
FROM empresa_contatos
ORDER BY empresa_id, principal DESC, created_at ASC;

COMMENT ON VIEW vw_empresa_contato_principal IS
  'Contato principal (fallback: mais antigo) por empresa, achatado para leitura.';


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>> 0046_empresa_bp_salvar_fn.sql <<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- ============================================================================
-- MIGRATION 0046 — RPC empresa_bp_salvar (Fase 2)
-- ============================================================================
-- Grava uma empresa (Business Partner) e suas filhas (papéis, endereços,
-- contatos, fiscal e o vínculo de grupo) numa ÚNICA transação (a função é
-- atômica: qualquer erro reverte tudo). Faz dupla-escrita das colunas legadas
-- de `empresas` (tipo / endereco / telefones / empresa_mae_id) para manter os
-- leitores antigos (PDFs, relatório mensal) funcionando na Fase 2.
--
-- SECURITY INVOKER (padrão): roda no contexto do usuário → a RLS continua
-- valendo (escrita de empresa é admin-only, como hoje). NÃO usar SECURITY
-- DEFINER aqui.
-- ============================================================================

CREATE OR REPLACE FUNCTION empresa_bp_salvar(p_id uuid, p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id     uuid;
  v_dona   boolean := COALESCE((p_payload->>'dona_sistema')::boolean, false);
  v_mae    uuid    := NULLIF(p_payload->>'empresa_mae_id', '')::uuid;
  v_papeis jsonb   := COALESCE(p_payload->'papeis', '[]'::jsonb);
  v_fiscal jsonb   := p_payload->'fiscal';
  v_tipo   text;
  v_end    jsonb;
  v_tel    text;
  v_telj   jsonb;
BEGIN
  -- Donas do sistema não têm empresa-mãe.
  IF v_dona THEN v_mae := NULL; END IF;

  -- tipo legado derivado dos papéis (dupla-escrita).
  v_tipo := CASE
    WHEN v_dona OR v_papeis ? 'dona' THEN 'propria'
    WHEN v_papeis ? 'cliente'        THEN 'contratante'
    ELSE 'terceira'
  END;

  -- Endereço principal -> JSONB legado empresas.endereco.
  SELECT jsonb_strip_nulls(jsonb_build_object(
           'cep', el->>'cep', 'logradouro', el->>'logradouro', 'numero', el->>'numero',
           'complemento', el->>'complemento', 'bairro', el->>'bairro',
           'municipio', el->>'municipio', 'uf', el->>'uf'))
    INTO v_end
  FROM jsonb_array_elements(COALESCE(p_payload->'enderecos', '[]'::jsonb)) el
  ORDER BY COALESCE((el->>'principal')::boolean, false) DESC
  LIMIT 1;
  IF v_end = '{}'::jsonb THEN v_end := NULL; END IF;

  -- Telefone principal -> JSONB legado empresas.telefones.
  SELECT el->>'valor'
    INTO v_tel
  FROM jsonb_array_elements(COALESCE(p_payload->'contatos', '[]'::jsonb)) el
  WHERE el->>'tipo' IN ('telefone', 'celular') AND COALESCE(el->>'valor', '') <> ''
  ORDER BY COALESCE((el->>'principal')::boolean, false) DESC
  LIMIT 1;
  IF v_tel IS NOT NULL THEN v_telj := jsonb_build_object('principal', v_tel); END IF;

  -- ----------------------------------------------------------------------------
  -- Empresa (cabeçalho do BP) — insert ou update
  -- ----------------------------------------------------------------------------
  IF p_id IS NULL THEN
    INSERT INTO empresas (razao_social, nome_fantasia, cnpj, inscricao_estadual,
                          tipo, dona_sistema, empresa_mae_id, ativo, endereco, telefones)
    VALUES (p_payload->>'razao_social', NULLIF(p_payload->>'nome_fantasia', ''),
            p_payload->>'cnpj', NULLIF(p_payload->>'inscricao_estadual', ''),
            v_tipo, v_dona, v_mae, COALESCE((p_payload->>'ativo')::boolean, true), v_end, v_telj)
    RETURNING id INTO v_id;
  ELSE
    v_id := p_id;
    UPDATE empresas SET
      razao_social       = p_payload->>'razao_social',
      nome_fantasia      = NULLIF(p_payload->>'nome_fantasia', ''),
      cnpj               = p_payload->>'cnpj',
      inscricao_estadual = NULLIF(p_payload->>'inscricao_estadual', ''),
      tipo               = v_tipo,
      dona_sistema       = v_dona,
      empresa_mae_id     = v_mae,
      ativo              = COALESCE((p_payload->>'ativo')::boolean, true),
      endereco           = v_end,
      telefones          = v_telj
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Empresa % não encontrada', v_id USING ERRCODE = 'no_data_found';
    END IF;
  END IF;

  -- ----------------------------------------------------------------------------
  -- Filhas — substitui o conjunto (replace) de forma atômica
  -- ----------------------------------------------------------------------------
  DELETE FROM empresa_papeis WHERE empresa_id = v_id;
  INSERT INTO empresa_papeis (empresa_id, papel)
  SELECT v_id, papel FROM jsonb_array_elements_text(v_papeis) AS papel
  ON CONFLICT (empresa_id, papel) DO NOTHING;

  DELETE FROM empresa_enderecos WHERE empresa_id = v_id;
  INSERT INTO empresa_enderecos (empresa_id, tipo, cep, logradouro, numero, complemento, bairro, municipio, uf, principal)
  SELECT v_id, COALESCE(el->>'tipo', 'sede'), el->>'cep', el->>'logradouro', el->>'numero',
         el->>'complemento', el->>'bairro', el->>'municipio', NULLIF(left(el->>'uf', 2), ''),
         COALESCE((el->>'principal')::boolean, false)
  FROM jsonb_array_elements(COALESCE(p_payload->'enderecos', '[]'::jsonb)) el;

  DELETE FROM empresa_contatos WHERE empresa_id = v_id;
  INSERT INTO empresa_contatos (empresa_id, tipo, valor, nome_contato, cargo_contato, principal)
  SELECT v_id, el->>'tipo', el->>'valor', el->>'nome_contato', el->>'cargo_contato',
         COALESCE((el->>'principal')::boolean, false)
  FROM jsonb_array_elements(COALESCE(p_payload->'contatos', '[]'::jsonb)) el;

  -- Fiscal 1:1 (replace; só grava se houver algum campo preenchido).
  DELETE FROM empresa_fiscal WHERE empresa_id = v_id;
  IF v_fiscal IS NOT NULL AND v_fiscal <> 'null'::jsonb AND (
       COALESCE(v_fiscal->>'inscricao_municipal', '') <> '' OR
       COALESCE(v_fiscal->>'cnae_principal', '') <> '' OR
       COALESCE(v_fiscal->>'regime_tributario', '') <> '' OR
       COALESCE(v_fiscal->>'situacao_cadastral', '') <> ''
  ) THEN
    INSERT INTO empresa_fiscal (empresa_id, inscricao_municipal, cnae_principal, regime_tributario, situacao_cadastral)
    VALUES (v_id, NULLIF(v_fiscal->>'inscricao_municipal', ''), NULLIF(v_fiscal->>'cnae_principal', ''),
            NULLIF(v_fiscal->>'regime_tributario', ''), NULLIF(v_fiscal->>'situacao_cadastral', ''));
  END IF;

  -- Vínculo de grupo (espelha empresa_mae_id). Só gerencia 'grupo' desta empresa;
  -- 'cliente_de' (de obras) é gerenciado pelo cadastro de obras, não aqui.
  DELETE FROM empresa_relacionamentos WHERE empresa_origem_id = v_id AND tipo_relacao = 'grupo';
  IF v_mae IS NOT NULL AND v_mae <> v_id THEN
    INSERT INTO empresa_relacionamentos (empresa_origem_id, empresa_destino_id, tipo_relacao)
    VALUES (v_id, v_mae, 'grupo')
    ON CONFLICT (empresa_origem_id, empresa_destino_id, tipo_relacao) DO NOTHING;
  END IF;

  RETURN v_id;
END $$;

COMMENT ON FUNCTION empresa_bp_salvar(uuid, jsonb) IS
  'Salva empresa (Business Partner) + filhas (papéis/endereços/contatos/fiscal/'
  'grupo) atomicamente, com dupla-escrita das colunas legadas. SECURITY INVOKER '
  '(RLS aplicada — escrita admin-only).';

GRANT EXECUTE ON FUNCTION empresa_bp_salvar(uuid, jsonb) TO authenticated;


-- ----------------------------------------------------------------------------
-- (Opcional) Sincroniza o histórico do Supabase CLI para que um futuro
-- 'supabase db push' reconheça estas migrations como já aplicadas.
-- ----------------------------------------------------------------------------
INSERT INTO supabase_migrations.schema_migrations (version) VALUES
  ('0040'),('0041'),('0042'),('0043'),('0044'),('0045'),('0046')
ON CONFLICT (version) DO NOTHING;
