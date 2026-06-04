-- 0015_soft_delete_columns.sql
-- Adiciona coluna "ativo" nas tabelas que ainda nao suportam soft delete

ALTER TABLE cargos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE epis ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE epi_entregas ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE treinamentos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE inspecoes ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE exames_medicos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
-- Obs.: não existe tabela "dds". O DDS (Diálogo Diário de Segurança) é
-- persistido em documentos_sst (tipo = 'dialogo_seguranca'). A linha
-- "ALTER TABLE dds ..." foi removida por referenciar uma tabela inexistente,
-- o que quebrava a recriação do schema do zero (Supabase Preview / dev novo).

CREATE INDEX IF NOT EXISTS idx_cargos_ativo ON cargos (ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_epis_ativo ON epis (ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_epi_entregas_ativo ON epi_entregas (ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_treinamentos_ativo ON treinamentos (ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_inspecoes_ativo ON inspecoes (ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_exames_medicos_ativo ON exames_medicos (ativo) WHERE ativo = true;
