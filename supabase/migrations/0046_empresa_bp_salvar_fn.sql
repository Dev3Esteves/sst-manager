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
