-- =====================================================================
-- 🔧 ROJGAR SUVIDHA — Study Hall Fixes
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- =====================================================================

-- 1. Add last_heartbeat column (if not already present)
--    This is needed for presence tracking in the Public Hall
ALTER TABLE public.study_session_users
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE
DEFAULT timezone('utc'::text, now());

-- 2. Add index for fast heartbeat queries
CREATE INDEX IF NOT EXISTS idx_study_session_heartbeat
ON public.study_session_users(room_id, last_heartbeat);

-- 3. Ensure the main public hall room exists with the correct seed UUID
--    The frontend uses UUID: 00000000-0000-0000-0000-000000000001
INSERT INTO public.study_rooms (id, name, category, theme_name, max_capacity, is_private)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '🏛️ Main Study Hall',
  'general',
  'library',
  9999,      -- Public hall supports unlimited users
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = '🏛️ Main Study Hall',
  max_capacity = 9999,
  is_private = false;

-- 4. Verify the rows
SELECT id, name, max_capacity, is_private FROM public.study_rooms
WHERE id = '00000000-0000-0000-0000-000000000001';
