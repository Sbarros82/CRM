-- ============================================================
-- 031_chat_channel_privacy.sql
--
-- Adiciona suporte a canais Público vs. Privado no Chat Interno.
--
-- Mudanças:
--   1. Coluna is_private em chat_channels (default false = público)
--   2. Atualiza create_chat_channel para aceitar p_is_private
--   3. Atualiza join_chat_channel para bloquear canais privados
-- ============================================================

-- ── 1. Coluna is_private ─────────────────────────────────────
ALTER TABLE chat_channels
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- ── 2. RPC create_chat_channel (atualizada) ──────────────────
CREATE OR REPLACE FUNCTION public.create_chat_channel(
  p_name        TEXT,
  p_description TEXT    DEFAULT NULL,
  p_is_private  BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_channel_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT account_id INTO v_account_id
    FROM profiles WHERE user_id = auth.uid();

  INSERT INTO chat_channels (account_id, name, description, is_dm, is_private, created_by)
  VALUES (v_account_id, trim(p_name), p_description, false, p_is_private, auth.uid())
  RETURNING id INTO v_channel_id;

  -- Criador entra automaticamente.
  INSERT INTO chat_channel_members (channel_id, user_id)
  VALUES (v_channel_id, auth.uid());

  RETURN v_channel_id;
END;
$$;

-- ── 3. RPC join_chat_channel (atualizada — bloqueia privados) ─
CREATE OR REPLACE FUNCTION public.join_chat_channel(p_channel_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_is_private BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT account_id INTO v_account_id
    FROM profiles WHERE user_id = auth.uid();

  SELECT is_private INTO v_is_private
    FROM chat_channels
   WHERE id = p_channel_id
     AND account_id = v_account_id
     AND is_dm = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Channel not found' USING ERRCODE = '42501';
  END IF;

  IF v_is_private THEN
    RAISE EXCEPTION 'Canal privado: é necessário convite para entrar' USING ERRCODE = '42501';
  END IF;

  INSERT INTO chat_channel_members (channel_id, user_id)
  VALUES (p_channel_id, auth.uid())
  ON CONFLICT (channel_id, user_id) DO NOTHING;
END;
$$;
