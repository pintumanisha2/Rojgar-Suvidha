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

-- Insert actual UPI settings
INSERT INTO site_settings (key, value) 
VALUES (
  'upi_payment_settings',
  '{"upi_id": "rojgarsuvidha@ybl", "account_name": "Pintu Kumar", "qr_image_url": "/phonepay-qr.png"}'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

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

-- ============================================================
-- PHASE 2 MIGRATION — Payment Improvements
-- Run ONLY after Phase 1 above is already applied
-- ============================================================

-- 6. Add screenshot URL + expired status support
ALTER TABLE user_applications
  ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

-- payment_status now also supports:
-- 'expired' → User did not pay within 20 min window

-- 7. Unique constraint: prevent same UTR on multiple paid/pending orders
-- (Soft unique — only applies to non-null UTR numbers)
CREATE UNIQUE INDEX IF NOT EXISTS idx_utr_unique_active
  ON user_applications (utr_number)
  WHERE utr_number IS NOT NULL
    AND payment_status IN ('pending_verification', 'paid');

-- 8. Index for screenshot queries in admin panel
CREATE INDEX IF NOT EXISTS idx_user_applications_screenshot
  ON user_applications (tracking_id)
  WHERE payment_screenshot_url IS NOT NULL;

-- ============================================================
-- 9. AUTO-EXPIRE CRON (Run via Supabase Dashboard > Cron Jobs)
-- Schedule: Every 30 minutes → */30 * * * *
-- ============================================================
-- Paste this SQL as the cron job body in Supabase Dashboard:
/*
UPDATE user_applications
SET
  payment_status = 'expired',
  application_status = 'Expired'
WHERE
  payment_status = 'pending_verification'
  AND utr_number IS NULL
  AND created_at < NOW() - INTERVAL '20 minutes';
*/

-- ============================================================
-- VERIFY PHASE 2
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'user_applications'
--   AND column_name IN ('payment_screenshot_url');
-- SELECT indexname FROM pg_indexes WHERE tablename = 'user_applications' AND indexname LIKE 'idx_utr%';

-- ============================================================
-- PHASE 3 MIGRATION — e-Suvidha Table Support
-- (apply_for_me_requests table bhi UPI use karta hai ab)
-- Run after Phase 2
-- ============================================================

-- 10. Add UTR + screenshot + amount columns to apply_for_me_requests
ALTER TABLE apply_for_me_requests
  ADD COLUMN IF NOT EXISTS utr_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2);

-- 11. status values for apply_for_me_requests:
-- 'pending'              → Form submitted, payment not done
-- 'pending_verification' → UTR submitted, admin to verify
-- 'paid'                 → Admin approved
-- 'rejected'             → Admin rejected
-- 'expired'              → 20 min timer expired, no UTR

-- 12. Index for UTR lookup in e-Suvidha orders
CREATE INDEX IF NOT EXISTS idx_afm_requests_utr
  ON apply_for_me_requests (utr_number)
  WHERE utr_number IS NOT NULL;

-- ============================================================
-- 13. AUTO-EXPIRE CRON for e-Suvidha orders
-- Schedule: Every 30 minutes → */30 * * * *
-- ============================================================
-- Add this as a SECOND cron job body in Supabase Dashboard:
/*
UPDATE apply_for_me_requests
SET status = 'expired'
WHERE
  status = 'pending_verification'
  AND utr_number IS NULL
  AND created_at < NOW() - INTERVAL '20 minutes';
*/

-- ============================================================
-- VERIFY PHASE 3
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'apply_for_me_requests'
--   AND column_name IN ('utr_number', 'payment_screenshot_url', 'amount_paid');


