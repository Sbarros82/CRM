-- ============================================================
-- 033_contact_avatars.sql
--
-- Public bucket for manual contact profile photos (Cloud API does
-- not send the customer's WhatsApp picture). Path convention matches
-- chat-media / flow-media so account-scoped RLS works:
--   contact-avatars/account-<account_id>/<contact_id>/avatar-<ts>.<ext>
--
-- Uploads go through /api/contacts/[id]/avatar (service role) so the
-- policies here are a backstop for any future client-side writes.
-- Idempotent — safe to re-run.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-avatars',
  'contact-avatars',
  TRUE,
  2097152, -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Contact avatars are publicly readable" ON storage.objects;
CREATE POLICY "Contact avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contact-avatars');

DROP POLICY IF EXISTS "Members can upload contact avatars" ON storage.objects;
CREATE POLICY "Members can upload contact avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contact-avatars'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Members can update contact avatars" ON storage.objects;
CREATE POLICY "Members can update contact avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'contact-avatars'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Members can delete contact avatars" ON storage.objects;
CREATE POLICY "Members can delete contact avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'contact-avatars'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );
