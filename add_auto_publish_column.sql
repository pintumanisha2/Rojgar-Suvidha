-- ═══════════════════════════════════════════════════════════════
-- Migration: Add auto_publish_at column to auto_blog_drafts
-- Run this ONCE in Supabase SQL Editor before deploying code
-- ═══════════════════════════════════════════════════════════════
--
-- Purpose:
--   SarkariResult drafts ko 45 min baad automatically publish karne ke liye.
--   FreeJobAlert / other sources: auto_publish_at = NULL → Manual approval only.
--
-- After running: Deploy code changes (Step 2 onwards)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE auto_blog_drafts
  ADD COLUMN IF NOT EXISTS auto_publish_at TIMESTAMPTZ DEFAULT NULL;

-- Fast index for cron query: pending drafts with a scheduled publish time
CREATE INDEX IF NOT EXISTS idx_drafts_auto_publish
  ON auto_blog_drafts (auto_publish_at)
  WHERE status = 'pending_review' AND auto_publish_at IS NOT NULL;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auto_blog_drafts'
  AND column_name = 'auto_publish_at';
