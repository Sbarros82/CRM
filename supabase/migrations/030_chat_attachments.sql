-- ============================================================
-- 030_chat_attachments.sql
--
-- Adiciona suporte a anexos (imagens e documentos) no Chat Interno.
--
-- Mudanças:
--   1. Colunas de anexo em chat_messages
--   2. Relaxa a constraint NOT NULL em content_text para permitir
--      mensagens com apenas anexo (sem texto).
--   3. Bucket "chat-attachments" no Supabase Storage com políticas RLS.
-- ============================================================

-- ── 1. Colunas de anexo em chat_messages ──────────────────────
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url  TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,   -- MIME type, ex: "image/png", "application/pdf"
  ADD COLUMN IF NOT EXISTS attachment_size BIGINT;  -- tamanho em bytes

-- ── 2. Relaxa CHECK: permite mensagem sem texto se houver anexo ─
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_content_text_check;

ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_content_check
    CHECK (
      char_length(trim(coalesce(content_text, ''))) > 0
      OR attachment_url IS NOT NULL
    );

-- ── 3. Bucket de Storage ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,                     -- privado: URLs assinadas via RPC
  20971520,                  -- 20 MB por arquivo
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/ogg', 'audio/wav'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Políticas de Storage ─────────────────────────────────────

-- Membros da conta podem fazer upload na própria pasta (account_id/channel_id/file).
DROP POLICY IF EXISTS "chat_attachments_upload" ON storage.objects;
CREATE POLICY "chat_attachments_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
  );

-- Membros autenticados podem ler (signed URLs controlam o acesso real).
DROP POLICY IF EXISTS "chat_attachments_read" ON storage.objects;
CREATE POLICY "chat_attachments_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
  );

-- Apenas o dono do arquivo pode deletar.
DROP POLICY IF EXISTS "chat_attachments_delete" ON storage.objects;
CREATE POLICY "chat_attachments_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
