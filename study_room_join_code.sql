-- Execute this script in your Supabase SQL Editor
ALTER TABLE public.study_rooms 
ADD COLUMN IF NOT EXISTS join_code TEXT;

-- Create unique index for join_code to ensure direct lookups are safe
CREATE UNIQUE INDEX IF NOT EXISTS study_rooms_join_code_idx 
ON public.study_rooms(join_code);

-- Seed a default public hall with join code "000000" if not already present
UPDATE public.study_rooms 
SET join_code = '000000' 
WHERE id = '00000000-0000-0000-0000-000000000001';
