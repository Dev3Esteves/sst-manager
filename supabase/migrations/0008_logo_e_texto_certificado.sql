-- ============================================================================
-- MIGRATION 0008 — Logo da empresa + texto customizável do certificado
-- ============================================================================

-- Adiciona campos necessários
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE treinamentos
  ADD COLUMN IF NOT EXISTS texto_certificado TEXT,
  ADD COLUMN IF NOT EXISTS cidade_emissao TEXT DEFAULT 'São Paulo';

-- Bucket público para logos das empresas (aparece em PDFs, precisa ser público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('logos-empresa', 'logos-empresa', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

-- Policies: qualquer autenticado lê (logos são públicos por serem usados em PDFs entregues a terceiros)
-- Escrita só admin/tec_seguranca
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_read_public') THEN
    CREATE POLICY "logos_read_public" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'logos-empresa');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_write_authenticated') THEN
    CREATE POLICY "logos_write_authenticated" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'logos-empresa'
        AND user_perfil_nome() IN ('admin', 'tec_seguranca')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_update_authenticated') THEN
    CREATE POLICY "logos_update_authenticated" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'logos-empresa'
        AND user_perfil_nome() IN ('admin', 'tec_seguranca')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_delete_authenticated') THEN
    CREATE POLICY "logos_delete_authenticated" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'logos-empresa'
        AND user_perfil_nome() IN ('admin', 'tec_seguranca')
      );
  END IF;
END $$;
