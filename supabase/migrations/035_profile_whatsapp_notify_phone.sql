-- Personal WhatsApp for AI handoff alerts to online agents.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_notify_phone TEXT;

COMMENT ON COLUMN public.profiles.whatsapp_notify_phone IS
  'Personal WhatsApp (digits) for AI handoff alerts when the member is online.';
