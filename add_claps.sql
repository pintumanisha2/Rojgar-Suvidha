-- Run this in Supabase SQL Editor
ALTER TABLE study_session_users ADD COLUMN IF NOT EXISTS claps_count INTEGER DEFAULT 0;
