-- ============================================================
-- Manual UPI Payment System — DB Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add new columns to user_applications table
ALTER TABLE user_applications 
  ADD COLUMN IF NOT EXISTS utr_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi_manual',
  ADD COLUMN IF NOT EXISTS utr_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS utr_verified_by TEXT,
  ADD COLUMN IF NOT EXISTS utr_rejection_reason TEXT;

-- payment_status values for manual UPI:
-- 'pending_verification' → UTR submitted, admin to verify
-- 'paid'                 → Admin approved
-- 'rejected'             → Admin rejected (wrong UTR etc)
-- 'free'                 → No payment required (coupon 100% etc)

-- 2. Create site_settings table (for storing UPI ID, QR, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default UPI settings (update with your actual details)
INSERT INTO site_settings (key, value) 
VALUES (
  'upi_payment_settings',
  '{"upi_id": "", "account_name": "Rojgar Suvidha", "qr_image_url": ""}'
)
ON CONFLICT (key) DO NOTHING;

-- 3. RLS Policies for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (needed for UPI payment screen)
CREATE POLICY "Public can read site_settings" 
  ON site_settings FOR SELECT 
  USING (true);

-- Only service role can write (admin API uses service role key)
CREATE POLICY "Service role can write site_settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Index for fast UTR lookup (duplicate detection)
CREATE INDEX IF NOT EXISTS idx_user_applications_utr_number 
  ON user_applications (utr_number) 
  WHERE utr_number IS NOT NULL;

-- 5. Index for fast pending verification queries (admin panel)
CREATE INDEX IF NOT EXISTS idx_user_applications_payment_method 
  ON user_applications (payment_method, payment_status, created_at DESC);

-- ============================================================
-- VERIFY: Run these to check migration success
-- ============================================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'user_applications' AND column_name IN ('utr_number', 'payment_method', 'utr_verified_at');
-- SELECT * FROM site_settings WHERE key = 'upi_payment_settings';
