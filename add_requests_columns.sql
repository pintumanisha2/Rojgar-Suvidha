-- SQL Migration: Add missing columns to BOTH apply_for_me_requests and user_applications tables
-- Copy and run this script in your Supabase Dashboard -> SQL Editor!

-- 1. Update apply_for_me_requests table
ALTER TABLE public.apply_for_me_requests 
ADD COLUMN IF NOT EXISTS applicant_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS tracking_id TEXT;

-- 2. Update user_applications table
ALTER TABLE public.user_applications 
ADD COLUMN IF NOT EXISTS tracking_id TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS alt_phone TEXT,
ADD COLUMN IF NOT EXISTS aadhar TEXT,
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS is_pwd BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS selected_post_name TEXT,
ADD COLUMN IF NOT EXISTS documents_urls JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_applied TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'Received';

-- Verify update completed successfully
COMMENT ON TABLE public.apply_for_me_requests IS 'Updated with direct service tracking columns';
COMMENT ON TABLE public.user_applications IS 'Updated with full application form columns';
