-- ============================================================
-- Rojgar Suvidha — Employer Calendar Schema
-- Run this ONCE in your Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS employer_interviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id         UUID, -- In a real app, references employer_profiles(id)
  employer_uid        TEXT, -- For simplicity with Clerk auth
  candidate_name      TEXT NOT NULL,
  candidate_email     TEXT,
  job_role            TEXT,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INTEGER DEFAULT 45,
  meeting_type        TEXT DEFAULT 'Video Call',
  room_id             TEXT,
  status              TEXT DEFAULT 'scheduled',
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Note: We use employer_uid for easy matching with clerk auth without strict foreign keys for now
