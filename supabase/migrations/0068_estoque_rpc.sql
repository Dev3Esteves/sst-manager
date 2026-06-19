-- ============================================================================
-- MIGRATION 0068 — Estoque de EPIs: motor transacional (RPCs)
-- ============================================================================
-- Custo médio ponderado + FEFO. Todas SECURITY INVOKER (RLS aplicada).
-- Lock pessimista (FOR UPDATE) no saldo para concorrência.

-- ── Helper interno: ENTRADA (recalcula custo médio ponderado) ────────────────
CREATE OR REPLACE FUNCTION estoque_aplicar_entrada(
  p_empresa uuid, p_epi uuid, p_local uuid, p_qtd numeric, p_custo_unit numeric,
  p_lote text, p_fab date, p_val date, p_tipo text, p_origem text,
  p_ref_tabela text, p_ref_id uuid, p_obs text
) RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_q numeric; v_ct numeric;
  v_novo_total numeric; v_nova_q numeric; v_novo_cm numeric;
  v_lote_id uuid; v_mov uuid;
BEGIN
  IF p_qtd <= 0 THEN RAISE EXCEPTION 'Quantidade de entrada deve ser > 0'; END IF;
  SELECT quantidade, custo_total INTO v_q, v_ct
    FROM estoque_saldo WHERE empresa_id=p_empresa AND epi_id=p_epi AND local_id=p_local FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO estoque_saldo(empresa_id, epi_id, local_id, quantidade, custo_medio, custo_total)
      VALUES (p_empresa, p_epi, p_local, 0, 0, 0);
    v_q := 0; v_ct := 0;
  END IF;
  v_novo_total := v_ct + p_qtd * p_custo_unit;
  v_nova_q := v_q + p_qtd;
  v_novo_cm := CASE WHEN v_nova_q > 0 THEN v_novo_total / v_nova_q ELSE 0 END;
  UPDATE estoque_saldo SET quantidade=v_nova_q, custo_medio=v_novo_cm, custo_total=v_novo_total, updated_at=now()
    WHERE empresa_id=p_empresa AND epi_id=p_epi AND local_id=p_local;

  SELECT id INTO v_lote_id FROM estoque_lote
    WHERE empresa_id=p_empresa AND epi_id=p_epi AND local_id=p_local
      AND lote IS NOT DISTINCT FROM p_lote AND validade IS NOT DISTINCT FROM p_val
    LIMIT 1;
  IF v_lote_id IS NULL THEN
    INSERT INTO estoque_lote(empresa_id, epi_id, local_id, lote, fabricacao, validade, saldo, custo_unitario)
      VALUES (p_empresa, p_epi, p_local, p_lote, p_fab, p_val, p_qtd, p_custo_unit) RETURNING id INTO v_lote_id;
  ELSE
    UPDATE estoque_lote SET saldo = saldo + p_qtd WHERE id = v_lote_id;
  END IF;

  INSERT INTO estoque_movimentacao(empresa_id, tipo, epi_id, local_id, lote_id, quantidade,
      custo_unitario, custo_total, saldo_apos, custo_medio_apos, origem, ref_tabela, ref_id, observacao)
    VALUES (p_empresa, p_tipo, p_epi, p_local, v_lote_id, p_qtd, p_custo_unit, p_qtd*p_custo_unit,
            v_nova_q, v_novo_cm, p_origem, p_ref_tabela, p_ref_id, p_obs)
    RETURNING id INTO v_mov;
  RETURN v_mov;
END $$;

-- ── Helper interno: SAÍDA (custo = médio do momento; consome lotes FEFO) ──────
CREATE OR REPLACE FUNCTION estoque_aplicar_saida(
  p_empresa uuid, p_epi uuid, p_local uuid, p_qtd numeric, p_tipo text, p_origem text,
  p_ref_tabela text, p_ref_id uuid, p_obs text, p_permite_negativo boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_q numeric; v_cm numeric; v_nova_q numeric; v_restante numeric;
  v_lote record; v_primeiro_lote uuid; v_mov uuid;
BEGIN
  IF p_qtd <= 0 THEN RAISE EXCEPTION 'Quantidade de saída deve ser > 0'; END IF;
  SELECT quantidade, custo_medio INTO v_q, v_cm
    FROM estoque_saldo WHERE empresa_id=p_empresa AND epi_id=p_epi AND local_id=p_local FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT p_permite_negativo THEN
      RAISE EXCEPTION 'Sem saldo de estoque para este EPI neste local' USING ERRCODE='check_violation';
    END IF;
    INSERT INTO estoque_saldo(empresa_id,epi_id,local_id,quantidade,custo_medio,custo_total)
      VALUES (p_empresa,p_epi,p_local,0,0,0);
    v_q := 0; v_cm := 0;
  END IF;
  IF v_q < p_qtd AND NOT p_permite_negativo THEN
    RAISE EXCEPTION 'Saldo insuficiente: disponível %, solicitado %', v_q, p_qtd USING ERRCODE='check_violation';
  END IF;
  v_nova_q := v_q - p_qtd;
  UPDATE estoque_saldo SET quantidade=v_nova_q, custo_total=v_nova_q*v_cm, updated_at=now()
    WHERE empresa_id=p_empresa AND epi_id=p_epi AND local_id=p_local;

  v_restante := p_qtd;
  FOR v_lote IN
    SELECT id, saldo FROM estoque_lote
     WHERE empresa_id=p_empresa AND epi_id=p_epi AND local_id=p_local AND saldo > 0
     ORDER BY validade NULLS LAST, created_at FOR UPDATE
  LOOP
    EXIT WHEN v_restante <= 0;
    IF v_primeiro_lote IS NULL THEN v_primeiro_lote := v_lote.id; END IF;
    IF v_lote.saldo >= v_restante THEN
      UPDATE estoque_lote SET saldo = saldo - v_restante WHERE id = v_lote.id;
      v_restante := 0;
    ELSE
      v_restante := v_restante - v_lote.saldo;
      UPDATE estoque_lote SET saldo = 0 WHERE id = v_lote.id;
    END IF;
  END LOOP;

  INSERT INTO estoque_movimentacao(empresa_id, tipo, epi_id, local_id, lote_id, quantidade,
      custo_unitario, custo_total, saldo_apos, custo_medio_apos, origem, ref_tabela, ref_id, observacao)
    VALUES (p_empresa, p_tipo, p_epi, p_local, v_primeiro_lote, p_qtd, v_cm, p_qtd*v_cm,
            v_nova_q, v_cm, p_origem, p_ref_tabela, p_ref_id, p_obs)
    RETURNING id INTO v_mov;
  RETURN v_mov;
END $$;

-- ── Públicas: entrada/saída/transferência/ajuste manuais ─────────────────────
CREATE OR REPLACE FUNCTION estoque_registrar_entrada(
  p_epi uuid, p_local uuid, p_qtd numeric, p_custo_unit numeric,
  p_lote text DEFAULT NULL, p_fab date DEFAULT NULL, p_val date DEFAULT NULL, p_obs text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RETURN estoque_aplicar_entrada(user_empresa_id(), p_epi, p_local, p_qtd, p_custo_unit,
    p_lote, p_fab, p_val, 'entrada', 'manual', NULL, NULL, p_obs);
END $$;

CREATE OR REPLACE FUNCTION estoque_registrar_saida(
  p_epi uuid, p_local uuid, p_qtd numeric, p_obs text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RETURN estoque_aplicar_saida(user_empresa_id(), p_epi, p_local, p_qtd, 'saida', 'manual', NULL, NULL, p_obs, false);
END $$;

CREATE OR REPLACE FUNCTION estoque_registrar_transferencia(
  p_epi uuid, p_local_orig uuid, p_local_dest uuid, p_qtd numeric, p_obs text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_emp uuid := user_empresa_id(); v_cm numeric;
BEGIN
  IF p_local_orig = p_local_dest THEN RAISE EXCEPTION 'Origem e destino devem ser diferentes'; END IF;
  PERFORM 1 FROM estoque_saldo WHERE empresa_id=v_emp AND epi_id=p_epi
    AND local_id IN (p_local_orig, p_local_dest) ORDER BY local_id FOR UPDATE;
  SELECT custo_medio INTO v_cm FROM estoque_saldo WHERE empresa_id=v_emp AND epi_id=p_epi AND local_id=p_local_orig;
  PERFORM estoque_aplicar_saida(v_emp, p_epi, p_local_orig, p_qtd, 'transferencia', 'transferencia', NULL, NULL, p_obs, false);
  PERFORM estoque_aplicar_entrada(v_emp, p_epi, p_local_dest, p_qtd, COALESCE(v_cm,0),
    NULL, NULL, NULL, 'transferencia', 'transferencia', NULL, NULL, p_obs);
END $$;

CREATE OR REPLACE FUNCTION estoque_registrar_ajuste(
  p_epi uuid, p_local uuid, p_qtd_contada numeric, p_obs text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_emp uuid := user_empresa_id(); v_q numeric; v_cm numeric; v_dif numeric;
BEGIN
  SELECT quantidade, custo_medio INTO v_q, v_cm
    FROM estoque_saldo WHERE empresa_id=v_emp AND epi_id=p_epi AND local_id=p_local FOR UPDATE;
  IF NOT FOUND THEN v_q := 0; v_cm := 0; END IF;
  v_dif := p_qtd_contada - v_q;
  IF v_dif = 0 THEN RETURN NULL; END IF;
  IF v_dif > 0 THEN
    RETURN estoque_aplicar_entrada(v_emp, p_epi, p_local, v_dif, v_cm, NULL, NULL, NULL,
      'ajuste', 'inventario', NULL, NULL, COALESCE(p_obs, 'Ajuste de inventário'));
  ELSE
    RETURN estoque_aplicar_saida(v_emp, p_epi, p_local, -v_dif, 'ajuste', 'inventario', NULL, NULL,
      COALESCE(p_obs, 'Ajuste de inventário'), true);
  END IF;
END $$;

-- ── Confirmar compra → entradas ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION estoque_confirmar_compra(p_compra_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_emp uuid; v_local uuid; v_status text; v_it record;
BEGIN
  SELECT empresa_id, local_id, status INTO v_emp, v_local, v_status
    FROM compra WHERE id = p_compra_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Compra não encontrada'; END IF;
  IF v_status <> 'rascunho' THEN RAISE EXCEPTION 'Compra já está "%" — não pode confirmar', v_status; END IF;
  FOR v_it IN SELECT * FROM compra_item WHERE compra_id = p_compra_id LOOP
    PERFORM estoque_aplicar_entrada(v_emp, v_it.epi_id, v_local, v_it.quantidade, v_it.custo_unitario,
      v_it.lote, v_it.fabricacao, v_it.validade, 'entrada', 'compra', 'compra_item', v_it.id, NULL);
  END LOOP;
  UPDATE compra SET status = 'confirmada' WHERE id = p_compra_id;
END $$;

-- ── Entrega ao colaborador = inserção + saída atômica ────────────────────────
CREATE OR REPLACE FUNCTION entrega_com_saida(p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_emp uuid := user_empresa_id();
  v_colab uuid := (p_payload->>'colaborador_id')::uuid;
  v_epi uuid := (p_payload->>'epi_id')::uuid;
  v_qtd numeric := COALESCE((p_payload->>'quantidade')::numeric, 1);
  v_obra uuid; v_local uuid; v_entrega uuid;
BEGIN
  SELECT obra_id INTO v_obra FROM colaboradores WHERE id = v_colab;
  IF v_obra IS NOT NULL THEN
    SELECT id INTO v_local FROM estoque_local WHERE empresa_id=v_emp AND obra_id=v_obra AND ativo LIMIT 1;
  END IF;
  IF v_local IS NULL THEN
    SELECT id INTO v_local FROM estoque_local WHERE empresa_id=v_emp AND tipo='central' AND ativo LIMIT 1;
  END IF;
  IF v_local IS NULL THEN
    RAISE EXCEPTION 'Nenhum local de estoque (obra do colaborador ou central) configurado para dar baixa' USING ERRCODE='check_violation';
  END IF;

  INSERT INTO epi_entregas(colaborador_id, epi_id, data_entrega, quantidade, motivo,
      assinatura_url, observacoes, ciencia)
    VALUES (v_colab, v_epi, COALESCE((p_payload->>'data_entrega')::date, current_date), v_qtd,
            p_payload->>'motivo', NULLIF(p_payload->>'assinatura_url',''), p_payload->>'observacoes',
            COALESCE((p_payload->>'ciencia')::boolean, false))
    RETURNING id INTO v_entrega;

  PERFORM estoque_aplicar_saida(v_emp, v_epi, v_local, v_qtd, 'saida', 'entrega',
    'epi_entregas', v_entrega, NULL, false);
  RETURN v_entrega;
END $$;

-- ── Devolução de entrega = entrada de retorno ────────────────────────────────
CREATE OR REPLACE FUNCTION estoque_devolucao(p_entrega_id uuid, p_obs text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_emp uuid := user_empresa_id(); v_epi uuid; v_qtd numeric; v_colab uuid; v_obra uuid; v_local uuid; v_cm numeric;
BEGIN
  SELECT epi_id, quantidade, colaborador_id INTO v_epi, v_qtd, v_colab
    FROM epi_entregas WHERE id = p_entrega_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Entrega não encontrada'; END IF;
  SELECT obra_id INTO v_obra FROM colaboradores WHERE id = v_colab;
  IF v_obra IS NOT NULL THEN
    SELECT id INTO v_local FROM estoque_local WHERE empresa_id=v_emp AND obra_id=v_obra AND ativo LIMIT 1;
  END IF;
  IF v_local IS NULL THEN
    SELECT id INTO v_local FROM estoque_local WHERE empresa_id=v_emp AND tipo='central' AND ativo LIMIT 1;
  END IF;
  IF v_local IS NULL THEN RAISE EXCEPTION 'Nenhum local de estoque para a devolução' USING ERRCODE='check_violation'; END IF;
  SELECT custo_medio INTO v_cm FROM estoque_saldo WHERE empresa_id=v_emp AND epi_id=v_epi AND local_id=v_local;
  RETURN estoque_aplicar_entrada(v_emp, v_epi, v_local, v_qtd, COALESCE(v_cm,0), NULL, NULL, NULL,
    'devolucao', 'devolucao', 'epi_entregas', p_entrega_id, p_obs);
END $$;

GRANT EXECUTE ON FUNCTION estoque_aplicar_entrada(uuid,uuid,uuid,numeric,numeric,text,date,date,text,text,text,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION estoque_aplicar_saida(uuid,uuid,uuid,numeric,text,text,text,uuid,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION estoque_registrar_entrada(uuid,uuid,numeric,numeric,text,date,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION estoque_registrar_saida(uuid,uuid,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION estoque_registrar_transferencia(uuid,uuid,uuid,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION estoque_registrar_ajuste(uuid,uuid,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION estoque_confirmar_compra(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION entrega_com_saida(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION estoque_devolucao(uuid,text) TO authenticated;
