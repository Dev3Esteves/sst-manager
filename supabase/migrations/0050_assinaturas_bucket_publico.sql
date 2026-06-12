-- ============================================================================
-- MIGRATION 0050 — Bucket 'assinaturas' público (corrige assinatura quebrada no DDS)
-- ============================================================================
--
-- O código (dds/actions.ts) grava a assinatura via storage.upload e guarda a
-- URL retornada por getPublicUrl() no conteúdo do documento. Porém o bucket
-- 'assinaturas' foi criado como PRIVADO (migration 0006), então a URL pública
-- não serve a imagem: ela aparece quebrada no detalhe do DDS (web) e não embeda
-- no PDF (o fetch server-side retorna 400). Tornar o bucket público resolve os
-- dois casos. Os caminhos usam UUID aleatório (dds/{uuid}/...-{timestamp}.png),
-- portanto não são adivinháveis. As policies de escrita/leitura autenticada e o
-- limite de tamanho/mime do 0006 permanecem.
-- ============================================================================

UPDATE storage.buckets SET public = true WHERE id = 'assinaturas';
