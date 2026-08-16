-- ══════════════════════════════════════════════════════════
-- Auto Blog System — Database Schema
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- Table 1: Auto-scraped blog drafts
CREATE TABLE IF NOT EXISTS auto_blog_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url        TEXT NOT NULL,
  source_title      TEXT,
  source_site       TEXT DEFAULT 'freejobales',

  -- Data extracted from source page
  apply_link        TEXT,           -- Actual apply URL or NULL if coming soon
  apply_status      TEXT DEFAULT 'unknown',  -- 'open' | 'coming_soon' | 'closed' | 'unknown'
  official_link     TEXT,           -- Official organization website
  notification_link TEXT,           -- Official PDF notification link
  state_code        TEXT,           -- State code ('UP', 'BH', 'MP', 'RJ', etc.) or NULL for All India
  last_date         TEXT,           -- Last date to apply
  total_posts       TEXT,           -- Total vacancies
  app_fee_gen       TEXT,           -- Fee for General/OBC
  app_fee_res       TEXT,           -- Fee for SC/ST/PH
  extracted_text    TEXT,           -- Full cleaned text from source page

  -- AI Generated content
  category          TEXT,           -- 'latest-jobs' | 'results' | 'admit-card' | 'admission' | 'answer-key'
  generated_title   TEXT,
  generated_meta    TEXT,
  generated_slug    TEXT,
  generated_html    TEXT,
  generated_tags    TEXT[],
  primary_keyword   TEXT,
  short_description TEXT,
  important_dates   TEXT,           -- JSON string of important dates
  last_date_parsed  DATE,
  total_posts_parsed INTEGER,

  -- Status tracking
  status            TEXT DEFAULT 'pending_review',
  -- 'pending_review' | 'published' | 'rejected' | 'error'
  error_message     TEXT,           -- If AI generation failed

  scraped_at        TIMESTAMPTZ DEFAULT NOW(),
  published_at      TIMESTAMPTZ,
  published_post_id UUID            -- Reference to jobs table row
);

-- Migration queries if table already created:
ALTER TABLE auto_blog_drafts ADD COLUMN IF NOT EXISTS important_dates TEXT;
ALTER TABLE auto_blog_drafts ADD COLUMN IF NOT EXISTS notification_link TEXT;
ALTER TABLE auto_blog_drafts ADD COLUMN IF NOT EXISTS state_code TEXT;

-- Table 2: Prevent duplicate scraping
CREATE TABLE IF NOT EXISTS scraped_urls_log (
  url        TEXT PRIMARY KEY,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_blog_drafts_status ON auto_blog_drafts(status);
CREATE INDEX IF NOT EXISTS idx_auto_blog_drafts_scraped_at ON auto_blog_drafts(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_blog_drafts_category ON auto_blog_drafts(category);

-- RLS: Only service role can access (cron uses service role key)
ALTER TABLE auto_blog_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_urls_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_role_all_auto_blog_drafts"
  ON auto_blog_drafts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_scraped_urls_log"
  ON scraped_urls_log FOR ALL
  USING (true)
  WITH CHECK (true);
