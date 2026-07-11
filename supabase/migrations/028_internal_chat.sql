-- ============================================================
-- 028_internal_chat.sql — Chat interno entre membros da equipa
--
-- Adiciona três tabelas para o módulo de chat estilo Slack:
--   • chat_channels        — canais temáticos e DMs
--   • chat_channel_members — membros de cada canal / DM
--   • chat_messages        — mensagens enviadas nos canais
--
-- DMs: is_dm = true, name = NULL, exatamente 2 membros.
-- A lógica de "já existe DM entre A e B" vive no RPC
-- open_or_create_dm abaixo.
--
-- Não-lidas: derivadas em runtime comparando
--   chat_messages.created_at > chat_channel_members.last_read_at
-- (atualizado pelo RPC mark_channel_read).
--
-- Idempotente — seguro executar múltiplas vezes.
-- ============================================================

-- ── chat_channels ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_channels (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id  UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name        TEXT,
  description TEXT,
  is_dm       BOOLEAN     NOT NULL DEFAULT false,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_channels_name_required
    CHECK (is_dm OR (name IS NOT NULL AND char_length(trim(name)) > 0))
);

CREATE INDEX IF NOT EXISTS chat_channels_account_idx
  ON chat_channels(account_id);

ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_channels_select ON chat_channels;
CREATE POLICY chat_channels_select ON chat_channels FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS chat_channels_insert ON chat_channels;
CREATE POLICY chat_channels_insert ON chat_channels FOR INSERT
  WITH CHECK (is_account_member(account_id) AND auth.uid() = created_by);

DROP POLICY IF EXISTS chat_channels_update ON chat_channels;
CREATE POLICY chat_channels_update ON chat_channels FOR UPDATE
  USING (
    is_account_member(account_id) AND (
      created_by = auth.uid() OR
      is_account_member(account_id, 'admin')
    )
  );

-- ── chat_channel_members ───────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_channel_members (
  channel_id   UUID        NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS chat_channel_members_user_idx
  ON chat_channel_members(user_id);

ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_channel_members_select ON chat_channel_members;
CREATE POLICY chat_channel_members_select ON chat_channel_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.id = channel_id
        AND is_account_member(cc.account_id)
    )
  );

-- ── chat_messages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id   UUID        NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL REFERENCES auth.users(id),
  content_text TEXT        NOT NULL CHECK (char_length(trim(content_text)) > 0),
  reply_to_id  UUID        REFERENCES chat_messages(id) ON DELETE SET NULL,
  edited_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_channel_created_idx
  ON chat_messages(channel_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_select ON chat_messages;
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members ccm
      WHERE ccm.channel_id = chat_messages.channel_id
        AND ccm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_messages_insert ON chat_messages;
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_channel_members ccm
      WHERE ccm.channel_id = chat_messages.channel_id
        AND ccm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_messages_update ON chat_messages;
CREATE POLICY chat_messages_update ON chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS chat_messages_delete ON chat_messages;
CREATE POLICY chat_messages_delete ON chat_messages FOR DELETE
  USING (sender_id = auth.uid());

-- ── RPCs ──────────────────────────────────────────────────

-- mark_channel_read: atualiza last_read_at do caller num canal.
CREATE OR REPLACE FUNCTION public.mark_channel_read(p_channel_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  UPDATE chat_channel_members
     SET last_read_at = now()
   WHERE channel_id = p_channel_id
     AND user_id = auth.uid();
END;
$$;

-- open_or_create_dm: devolve (ou cria) canal DM entre caller e outro membro.
CREATE OR REPLACE FUNCTION public.open_or_create_dm(p_other_user_id UUID)
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

  IF NOT EXISTS (
    SELECT 1 FROM profiles
     WHERE user_id = p_other_user_id AND account_id = v_account_id
  ) THEN
    RAISE EXCEPTION 'Target user not in same account' USING ERRCODE = '42501';
  END IF;

  SELECT ccm1.channel_id INTO v_channel_id
    FROM chat_channel_members ccm1
    JOIN chat_channel_members ccm2 ON ccm1.channel_id = ccm2.channel_id
    JOIN chat_channels cc ON cc.id = ccm1.channel_id
   WHERE ccm1.user_id = auth.uid()
     AND ccm2.user_id = p_other_user_id
     AND cc.is_dm = true
     AND cc.account_id = v_account_id
   LIMIT 1;

  IF v_channel_id IS NOT NULL THEN
    RETURN v_channel_id;
  END IF;

  INSERT INTO chat_channels (account_id, is_dm, created_by)
  VALUES (v_account_id, true, auth.uid())
  RETURNING id INTO v_channel_id;

  INSERT INTO chat_channel_members (channel_id, user_id)
  VALUES (v_channel_id, auth.uid()), (v_channel_id, p_other_user_id);

  RETURN v_channel_id;
END;
$$;

-- create_chat_channel: cria canal e adiciona o criador como membro.
CREATE OR REPLACE FUNCTION public.create_chat_channel(
  p_name TEXT,
  p_description TEXT DEFAULT NULL
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

  INSERT INTO chat_channels (account_id, name, description, is_dm, created_by)
  VALUES (v_account_id, trim(p_name), p_description, false, auth.uid())
  RETURNING id INTO v_channel_id;

  INSERT INTO chat_channel_members (channel_id, user_id)
  VALUES (v_channel_id, auth.uid());

  RETURN v_channel_id;
END;
$$;

-- join_chat_channel: entra num canal público.
CREATE OR REPLACE FUNCTION public.join_chat_channel(p_channel_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT account_id INTO v_account_id
    FROM profiles WHERE user_id = auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM chat_channels
     WHERE id = p_channel_id AND account_id = v_account_id AND is_dm = false
  ) THEN
    RAISE EXCEPTION 'Channel not found' USING ERRCODE = '42501';
  END IF;

  INSERT INTO chat_channel_members (channel_id, user_id)
  VALUES (p_channel_id, auth.uid())
  ON CONFLICT (channel_id, user_id) DO NOTHING;
END;
$$;

-- ── Realtime ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_channel_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_channel_members;
  END IF;
END $$;

-- ── Canal #geral por defeito ──────────────────────────────
-- Para cada account existente sem canal #geral, cria-o e
-- adiciona todos os membros do account automaticamente.
DO $$
DECLARE
  r          RECORD;
  v_channel_id UUID;
  v_member   RECORD;
BEGIN
  FOR r IN SELECT id, owner_user_id FROM accounts LOOP
    IF NOT EXISTS (
      SELECT 1 FROM chat_channels
       WHERE account_id = r.id AND name = 'geral' AND is_dm = false
    ) THEN
      INSERT INTO chat_channels (account_id, name, description, is_dm, created_by)
      VALUES (r.id, 'geral', 'Canal geral da equipa', false, r.owner_user_id)
      RETURNING id INTO v_channel_id;

      FOR v_member IN
        SELECT user_id FROM profiles WHERE account_id = r.id
      LOOP
        INSERT INTO chat_channel_members (channel_id, user_id)
        VALUES (v_channel_id, v_member.user_id)
        ON CONFLICT (channel_id, user_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;
