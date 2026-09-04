-- ═══════════════════════════════════════════════════════════════════
-- Backlinks Engine Migration: Add target_url and published_at
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add target_url column to store internal Rojgar Suvidha page being targeted
ALTER TABLE backlinks_log ADD COLUMN IF NOT EXISTS target_url TEXT;

-- 2. Add published_at column to record exact publication timestamp
ALTER TABLE backlinks_log ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 3. Populate existing rows: copy existing rojgarsuvidha.com placeholder URLs to target_url
UPDATE backlinks_log
SET target_url = backlink_url
WHERE target_url IS NULL AND backlink_url LIKE '%rojgarsuvidha.com%';

-- 4. Clear placeholder rojgarsuvidha.com from backlink_url for queued items
UPDATE backlinks_log
SET backlink_url = ''
WHERE status = 'queued' AND backlink_url LIKE '%rojgarsuvidha.com%';

-- 5. Create index for fast status and job lookup
CREATE INDEX IF NOT EXISTS idx_backlinks_log_status ON backlinks_log(status);
CREATE INDEX IF NOT EXISTS idx_backlinks_log_job_id ON backlinks_log(job_id);
