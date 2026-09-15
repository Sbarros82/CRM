-- ============================================================
-- 034_auto_join_public_chat.sql
--
-- Novos membros da conta entram automaticamente em todos os
-- canais públicos (não-DM, não-privados). Sem isso, só quem
-- existia quando o #geral foi criado aparece no Chat interno.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_profile_to_public_chat_channels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.account_id IS NOT DISTINCT FROM NEW.account_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO chat_channel_members (channel_id, user_id)
  SELECT cc.id, NEW.user_id
    FROM chat_channels cc
   WHERE cc.account_id = NEW.account_id
     AND cc.is_dm = false
     AND COALESCE(cc.is_private, false) = false
  ON CONFLICT (channel_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_join_public_chat ON profiles;
CREATE TRIGGER trg_profiles_join_public_chat
  AFTER INSERT OR UPDATE OF account_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_public_chat_channels();

-- Backfill: membros atuais que ainda não estão nos canais públicos.
INSERT INTO chat_channel_members (channel_id, user_id)
SELECT cc.id, p.user_id
  FROM profiles p
  JOIN chat_channels cc ON cc.account_id = p.account_id
 WHERE p.account_id IS NOT NULL
   AND cc.is_dm = false
   AND COALESCE(cc.is_private, false) = false
ON CONFLICT (channel_id, user_id) DO NOTHING;
