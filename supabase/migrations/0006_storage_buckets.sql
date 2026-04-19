-- ============================================================================
-- MIGRATION 0006 — Storage buckets para Documentos SST
-- ============================================================================

-- Buckets privados — acesso somente via policies (RLS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('assinaturas', 'assinaturas', false, 524288, ARRAY['image/png','image/jpeg']),
  ('fotos', 'fotos', false, 5242880, ARRAY['image/png','image/jpeg','image/webp']),
  ('documentos-pdf', 'documentos-pdf', false, 10485760, ARRAY['application/pdf']),
  ('aso-pdf', 'aso-pdf', false, 5242880, ARRAY['application/pdf']),
  ('certificados', 'certificados', false, 5242880, ARRAY['application/pdf','image/png','image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Policies: authenticated users podem ler/escrever nos buckets de sua empresa
-- Usa user_empresa_id() helper criado na migration 0002
CREATE POLICY "storage_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('assinaturas','fotos','documentos-pdf','aso-pdf','certificados'));

CREATE POLICY "storage_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('assinaturas','fotos','documentos-pdf','aso-pdf','certificados'));

CREATE POLICY "storage_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('assinaturas','fotos','documentos-pdf','aso-pdf','certificados'));

CREATE POLICY "storage_delete_admin_tec" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('assinaturas','fotos','documentos-pdf','aso-pdf','certificados')
    AND user_perfil_nome() IN ('admin', 'tec_seguranca')
  );
