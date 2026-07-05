-- SQL Migration: Add missing columns to apply_for_me_requests table
-- Copy and run this script in your Supabase Dashboard -> SQL Editor!

ALTER TABLE public.apply_for_me_requests 
ADD COLUMN IF NOT EXISTS applicant_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS tracking_id TEXT;

-- Verify columns are successfully added
COMMENT ON TABLE public.apply_for_me_requests IS 'Updated with direct service tracking columns';
