-- ============================================================
-- 032_sales_os.sql — opt-out, janela 24h, IA, audit, follow-up
--
-- Adds the operational layer inspired by DeskcommCRM without
-- replacing the existing Cloud API / flows / broadcasts stack:
--   1. Contact opt-out (STOP / SAIR) + conversation inbound/outbound
--      timestamps so session-window and radar queries stay cheap.
--   2. Per-account AI agent settings (public) + encrypted API key
--      in a secrets table that authenticated clients cannot SELECT.
--   3. Append-only audit_log for mutations that matter (broadcast,
--      erase, opt-out, AI handoff, role changes).
--
-- Idempotent — safe to run multiple times.
-- ============================================================

-- ============================================================
-- CONTACTS — opt-out
-- ============================================================
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opted_out_keyword TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_account_opted_out
  ON contacts(account_id)
  WHERE opted_out_at IS NOT NULL;

-- ============================================================
-- CONVERSATIONS — session window + AI pause + radar
-- ============================================================
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_inbound_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_outbound_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_paused BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_conversations_radar
  ON conversations(account_id, last_inbound_at)
  WHERE status IN ('open', 'pending');

-- Backfill session timestamps from existing messages so Radar and the
-- 24h window work on day one, not only after the next inbound.
UPDATE conversations c
SET last_inbound_at = sub.last_in
FROM (
  SELECT conversation_id, MAX(created_at) AS last_in
  FROM messages
  WHERE sender_type = 'customer'
  GROUP BY conversation_id
) sub
WHERE c.id = sub.conversation_id
  AND c.last_inbound_at IS NULL;

UPDATE conversations c
SET last_outbound_at = sub.last_out
FROM (
  SELECT conversation_id, MAX(created_at) AS last_out
  FROM messages
  WHERE sender_type IN ('agent', 'bot')
  GROUP BY conversation_id
) sub
WHERE c.id = sub.conversation_id
  AND c.last_outbound_at IS NULL;

-- ============================================================
-- ACCOUNTS — AI + follow-up knobs (no secrets here)
-- ============================================================
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_provider TEXT NOT NULL DEFAULT 'openai',
  ADD COLUMN IF NOT EXISTS ai_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_hours INTEGER NOT NULL DEFAULT 24;

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_ai_provider_check;
ALTER TABLE accounts
  ADD CONSTRAINT accounts_ai_provider_check
  CHECK (ai_provider IN ('openai', 'openrouter', 'anthropic'));

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_follow_up_hours_check;
ALTER TABLE accounts
  ADD CONSTRAINT accounts_follow_up_hours_check
  CHECK (follow_up_hours BETWEEN 1 AND 168);

-- ============================================================
-- ACCOUNT_AI_SECRETS — service-role only
--
-- No policies for `authenticated` on purpose: the encrypted key
-- must never ship to the browser. Route handlers read it with the
-- service-role client.
-- ============================================================
CREATE TABLE IF NOT EXISTS account_ai_secrets (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  api_key_encrypted TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE account_ai_secrets ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_updated_at ON account_ai_secrets;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_ai_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUDIT LOG — append-only
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_account_created
  ON audit_log(account_id, created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_select ON audit_log;
DROP POLICY IF EXISTS audit_log_insert ON audit_log;
CREATE POLICY audit_log_select ON audit_log FOR SELECT
  USING (is_account_member(account_id, 'admin'));
-- Agents+ can append; nobody can update/delete via the client.
CREATE POLICY audit_log_insert ON audit_log FOR INSERT
  WITH CHECK (is_account_member(account_id, 'agent'));
