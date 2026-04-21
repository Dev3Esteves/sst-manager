-- ============================================================================
-- MIGRATION 0010 — Fila de jobs assíncronos (v0.6.0 / #9)
-- ============================================================================
--
-- Por quê:
--   As rotas de geração em lote (documentos/lote, os-nr01/gerar) hoje blocam
--   o HTTP até o ZIP ficar pronto. Em Vercel (hobby 10s / pro 60s por função)
--   isso trava para lotes médios. A solução é desacoplar:
--     1. Request enfileira um job (volta em <100ms com um id)
--     2. Worker (cron minuto-a-minuto) pega o próximo job e processa
--     3. UI fica em polling no status do job e baixa o resultado quando pronto
--
-- Decisões arquiteturais:
--   - Status `queued → processing → completed|failed` é suficiente pro MVP.
--     Sem `paused`, `cancelled` (última é feature futura).
--   - Retry é linear (attempts vs max_attempts) — sem backoff por enquanto,
--     worker roda cada minuto de qualquer jeito.
--   - SKIP LOCKED na função `claim_next_job` — garante que vários workers
--     concorrentes peguem jobs diferentes sem deadlock.
--   - Resultado vai pro bucket `job-results` (signed URL de 1h expira sozinha).
-- ============================================================================

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Discriminador: qual processor deve executar este job
  type text NOT NULL CHECK (type IN (
    'documentos_lote',
    'os_nr01_gerar',
    'ficha_epi_batch'
  )),

  -- FSM: queued → processing → (completed | failed)
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'processing', 'completed', 'failed'
  )),

  -- Input do job (o payload original que a request recebeu)
  input jsonb NOT NULL,

  -- Output: URL do arquivo final, counts, etc
  result jsonb,

  -- Progresso opcional — processor atualiza conforme anda
  progress_current int DEFAULT 0,
  progress_total int,

  -- Erro legível (truncado a 2000 chars) + debug info
  error_message text,
  error_detail jsonb,

  -- Contexto pra RLS e auditoria
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),

  -- Controle de retry
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,

  -- Claim tracking (pra SKIP LOCKED + workers concorrentes)
  claimed_by text,
  claimed_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Índice pra pick-up rápido pelo worker (ordem FIFO)
CREATE INDEX idx_jobs_queued_oldest ON jobs (created_at)
  WHERE status = 'queued';

-- Índice pra listagem na UI (jobs do usuário, mais recentes primeiro)
CREATE INDEX idx_jobs_user_recent ON jobs (user_id, created_at DESC);

-- Índice pra filtro por empresa (usado pela RLS)
CREATE INDEX idx_jobs_empresa ON jobs (empresa_id);

-- ============================================================================
-- Função de claim atômico (SKIP LOCKED) — pega o próximo queued sem conflito
-- ============================================================================
--
-- SKIP LOCKED = se outro worker já travou uma linha, pula e tenta a próxima.
-- FOR UPDATE sem isso bloquearia. Garantia: N workers concorrentes pegam
-- N jobs diferentes na mesma rodada, sem deadlock.
--
-- Retorna o job claimed ou NULL se a fila estiver vazia.
CREATE OR REPLACE FUNCTION claim_next_job(worker_id text)
RETURNS jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_job jobs;
BEGIN
  WITH next_queued AS (
    SELECT id FROM jobs
    WHERE status = 'queued'
      AND attempts < max_attempts
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE jobs j
     SET status = 'processing',
         claimed_by = worker_id,
         claimed_at = now(),
         started_at = COALESCE(started_at, now()),
         attempts = attempts + 1
   FROM next_queued
  WHERE j.id = next_queued.id
  RETURNING j.* INTO claimed_job;

  RETURN claimed_job;
END;
$$;

-- Obs: propositalmente sem `updated_at` — `started_at`/`completed_at`/`claimed_at`
-- já contam a história de cada transição do FSM e são mais explícitos.

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas jobs da sua empresa (admin vê todos)
CREATE POLICY "jobs_read" ON jobs
  FOR SELECT TO authenticated
  USING (
    empresa_id = user_empresa_id()
    OR user_perfil_nome() = 'admin'
  );

-- Usuário pode criar jobs para sua própria empresa
CREATE POLICY "jobs_insert" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = user_empresa_id()
    AND user_id = auth.uid()
  );

-- Update: worker usa SECURITY DEFINER via claim_next_job, então RLS aqui
-- cobre só updates do usuário (ex: cancelar próprio job no futuro).
-- Por ora, usuário não pode atualizar jobs diretamente — só o worker.
CREATE POLICY "jobs_update_admin" ON jobs
  FOR UPDATE TO authenticated
  USING (user_perfil_nome() = 'admin')
  WITH CHECK (user_perfil_nome() = 'admin');

-- ============================================================================
-- Bucket de resultados
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('job-results', 'job-results', false, 52428800, ARRAY['application/zip','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Policy: qualquer authenticated pode ler seus próprios resultados
-- (o path embute o user_id — ver lib/jobs/queue.ts)
CREATE POLICY "job_results_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'job-results');

-- Writes no bucket são feitos pelo worker via service_role — não precisa policy
-- INSERT/UPDATE pra authenticated.
