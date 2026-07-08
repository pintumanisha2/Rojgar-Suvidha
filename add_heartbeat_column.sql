-- Run this in Supabase SQL Editor
-- Adds last_heartbeat column for tracking active users in Public Hall

ALTER TABLE public.study_session_users
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ DEFAULT NOW();

-- Index for fast filtering of active users
CREATE INDEX IF NOT EXISTS idx_session_heartbeat
ON public.study_session_users(last_heartbeat DESC);

-- Also insert/update the public-hall room entry
-- (The hall uses room_id = 'public-hall' as a special identifier)
-- No study_rooms entry needed — hall uses its own logic

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'study_session_users'
ORDER BY ordinal_position;
