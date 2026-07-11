-- ============================================================
-- 027_appointments.sql — Appointments module
--
-- Adds three tables:
--   services              — catalogue of services offered by an account
--   appointments          — individual appointment bookings
--   appointment_reminders — tracks which reminders have been sent
--
-- All tables are account-scoped and RLS-protected following the
-- same conventions established in migrations 001 and 017.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- SERVICES — catalogue of bookable services per account
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price            NUMERIC(10, 2),
  color            TEXT NOT NULL DEFAULT '#6366f1',
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_account_id ON services(account_id);
CREATE INDEX IF NOT EXISTS idx_services_account_active ON services(account_id, active);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Account members can view services" ON services;
DROP POLICY IF EXISTS "Account admins can manage services" ON services;

-- All members can view services
CREATE POLICY "Account members can view services" ON services
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Only owner/admin can create, update, delete
CREATE POLICY "Account admins can manage services" ON services
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM profiles
      WHERE user_id = auth.uid()
        AND account_role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- APPOINTMENTS — individual bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES contacts(id) ON DELETE SET NULL,
  service_id   UUID REFERENCES services(id) ON DELETE SET NULL,
  assigned_to  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'scheduled'
                 CHECK (status IN ('scheduled','confirmed','cancelled','completed','no_show')),
  notes        TEXT,
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_account_id      ON appointments(account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at    ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_contact_id      ON appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status          ON appointments(account_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to     ON appointments(assigned_to);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Account members can view appointments" ON appointments;
DROP POLICY IF EXISTS "Account agents can manage appointments" ON appointments;

-- All members can view
CREATE POLICY "Account members can view appointments" ON appointments
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Agent, admin and owner can create/update/delete
CREATE POLICY "Account agents can manage appointments" ON appointments
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM profiles
      WHERE user_id = auth.uid()
        AND account_role IN ('owner', 'admin', 'agent')
    )
  );

-- ============================================================
-- APPOINTMENT_REMINDERS — tracks sent reminders (dedup guard)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id   UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type    TEXT NOT NULL CHECK (reminder_type IN ('confirmation', '24h', '1h')),
  sent_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (appointment_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_appt_reminders_appointment_id ON appointment_reminders(appointment_id);

-- No RLS needed — only accessed by service role (webhook + cron)
-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
