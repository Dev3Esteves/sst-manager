-- ============================================================================
-- MIGRATION 0061 — empresa_bp_salvar v2 (própria em vez de dona_sistema)
-- ============================================================================
-- Lê `propria` do payload (aceita alias `dona_sistema` na transição), grava
-- empresas.propria E mantém dupla-escrita do legado (tipo/dona_sistema) até a
-- Onda 3 (0062). Normaliza papel 'dona' -> 'propria'. Retrocompatível: aceita
-- payloads antigos (dona_sistema) e novos (propria). SECURITY INVOKER.

CREATE OR REPLACE FUNCTION empresa_bp_salvar(p_id uuid, p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id      uuid;
  v_propria boolean := COALESCE((p_payload->>'propria')::boolean, (p_payload->>'dona_sistema')::boolean, false);
  v_mae     uuid    := NULLIF(p_payload->>'empresa_mae_id', '')::uuid;
  v_papeis  jsonb   := COALESCE(p_payload->'papeis', '[]'::jsonb);
  v_fiscal  jsonb   := p_payload->'fiscal';
  v_tipo    text;
  v_end     jsonb;
  v_tel     text;
  v_telj    jsonb;
BEGIN
  -- Empresas próprias não têm empresa-mãe (parceiro).
  IF v_propria THEN v_mae := NULL; END IF;

  -- tipo legado derivado (dupla-escrita).
  v_tipo := CASE
    WHEN v_propria OR v_papeis ? 'propria' OR v_papeis ? 'dona' THEN 'propria'
    WHEN v_papeis ? 'cliente'                                    THEN 'contratante'
    ELSE 'terceira'
  END;

  SELECT jsonb_strip_nulls(jsonb_build_object(
           'cep', el->>'cep', 'logradouro', el->>'logradouro', 'numero', el->>'numero',
           'complemento', el->>'complemento', 'bairro', el->>'bairro',
           'municipio', el->>'municipio', 'uf', el->>'uf'))
    INTO v_end
  FROM jsonb_array_elements(COALESCE(p_payload->'enderecos', '[]'::jsonb)) el
  ORDER BY COALESCE((el->>'principal')::boolean, false) DESC
  LIMIT 1;
  IF v_end = '{}'::jsonb THEN v_end := NULL; END IF;

  SELECT el->>'valor'
    INTO v_tel
  FROM jsonb_array_elements(COALESCE(p_payload->'contatos', '[]'::jsonb)) el
  WHERE el->>'tipo' IN ('telefone', 'celular') AND COALESCE(el->>'valor', '') <> ''
  ORDER BY COALESCE((el->>'principal')::boolean, false) DESC
  LIMIT 1;
  IF v_tel IS NOT NULL THEN v_telj := jsonb_build_object('principal', v_tel); END IF;

  IF p_id IS NULL THEN
    INSERT INTO empresas (razao_social, nome_fantasia, cnpj, inscricao_estadual,
                          tipo, dona_sistema, propria, empresa_mae_id, ativo, endereco, telefones)
    VALUES (p_payload->>'razao_social', NULLIF(p_payload->>'nome_fantasia', ''),
            p_payload->>'cnpj', NULLIF(p_payload->>'inscricao_estadual', ''),
            v_tipo, v_propria, v_propria, v_mae, COALESCE((p_payload->>'ativo')::boolean, true), v_end, v_telj)
    RETURNING id INTO v_id;
  ELSE
    v_id := p_id;
    UPDATE empresas SET
      razao_social       = p_payload->>'razao_social',
      nome_fantasia      = NULLIF(p_payload->>'nome_fantasia', ''),
      cnpj               = p_payload->>'cnpj',
      inscricao_estadual = NULLIF(p_payload->>'inscricao_estadual', ''),
      tipo               = v_tipo,
      dona_sistema       = v_propria,
      propria            = v_propria,
      empresa_mae_id     = v_mae,
      ativo              = COALESCE((p_payload->>'ativo')::boolean, true),
      endereco           = v_end,
      telefones          = v_telj
    WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Empresa % não encontrada', v_id USING ERRCODE = 'no_data_found';
    END IF;
  END IF;

  -- Papéis (replace), normalizando 'dona' legado -> 'propria'.
  DELETE FROM empresa_papeis WHERE empresa_id = v_id;
  INSERT INTO empresa_papeis (empresa_id, papel)
  SELECT v_id, CASE WHEN papel = 'dona' THEN 'propria' ELSE papel END
  FROM jsonb_array_elements_text(v_papeis) AS papel
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

  DELETE FROM empresa_relacionamentos WHERE empresa_origem_id = v_id AND tipo_relacao = 'grupo';
  IF v_mae IS NOT NULL AND v_mae <> v_id THEN
    INSERT INTO empresa_relacionamentos (empresa_origem_id, empresa_destino_id, tipo_relacao)
    VALUES (v_id, v_mae, 'grupo')
    ON CONFLICT (empresa_origem_id, empresa_destino_id, tipo_relacao) DO NOTHING;
  END IF;

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION empresa_bp_salvar(uuid, jsonb) TO authenticated;
