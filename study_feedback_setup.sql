-- =====================================================================
-- 📝 ROJGAR SUVIDHA — Study Room Feedback Table Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.study_room_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.study_room_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert feedback
CREATE POLICY "Allow authenticated insert" 
ON public.study_room_feedback
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow anonymous users to insert feedback (optional backup)
CREATE POLICY "Allow anon insert" 
ON public.study_room_feedback
FOR INSERT 
TO anon 
WITH CHECK (true);
