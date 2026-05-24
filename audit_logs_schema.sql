-- ============================================================
-- Rojgar Suvidha — Employer Activity Logs Schema
-- Run this ONCE in your Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS employer_activity_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_uid        TEXT NOT NULL, -- Ties to the company/employer account
  user_name           TEXT NOT NULL, -- Who performed the action
  action_type         TEXT NOT NULL, -- e.g., 'Invited Member', 'Removed Member', 'Posted Job'
  target_details      TEXT NOT NULL, -- e.g., 'Rahul Verma (Technical Interviewer)'
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries when loading logs for an employer
CREATE INDEX IF NOT EXISTS idx_activity_logs_employer 
ON employer_activity_logs (employer_uid);
