-- SQL Migration: Add missing columns and create otp_requests table
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

-- 3. Create otp_requests table
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apply_request_id UUID REFERENCES public.apply_for_me_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  verification_code TEXT,
  otp_value TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'fulfilled', 'expired'
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for otp_requests
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for otp_requests
DROP POLICY IF EXISTS "Users can manage own otp_requests" ON public.otp_requests;
CREATE POLICY "Users can manage own otp_requests" ON public.otp_requests 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to otp_requests" ON public.otp_requests;
CREATE POLICY "Admins have full access to otp_requests" ON public.otp_requests 
  FOR ALL USING (true) WITH CHECK (true);

-- Verify updates
COMMENT ON TABLE public.apply_for_me_requests IS 'Updated with direct service tracking columns';
COMMENT ON TABLE public.user_applications IS 'Updated with full application form columns';
COMMENT ON TABLE public.otp_requests IS 'Real-time client OTP request channel';
