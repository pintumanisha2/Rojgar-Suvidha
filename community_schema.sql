-- ============================================================
-- Rojgar Suvidha — Private Jobs Community Schema
-- Run this ONCE in your Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS private_community_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- The content of the post
  content             TEXT NOT NULL,
  
  -- Tags/Categories: 'General', 'IT/Engineering', 'BPO/Calling', 'Sales/Marketing', 'Interview-Prep'
  category            TEXT DEFAULT 'General',
  
  -- Admin control if needed
  is_blocked          BOOLEAN DEFAULT false,
  
  -- Cached author name and avatar for fast real-time reads without joins
  author_name         TEXT NOT NULL,
  author_avatar       TEXT,
  
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE private_community_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read active posts
DROP POLICY IF EXISTS "Public can read active community posts" ON private_community_posts;
CREATE POLICY "Public can read active community posts"
  ON private_community_posts FOR SELECT
  USING (is_blocked = false);

-- Users can insert their own posts (we'll also allow server-side API insertions using service role)
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON private_community_posts;
CREATE POLICY "Authenticated users can insert posts"
  ON private_community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all
DROP POLICY IF EXISTS "Admins manage community posts" ON private_community_posts;
CREATE POLICY "Admins manage community posts"
  ON private_community_posts FOR ALL
  USING (true) WITH CHECK (true);

-- Enable Realtime for this table
-- This tells Supabase to broadcast INSERT/UPDATE/DELETE events to listening clients
alter publication supabase_realtime add table private_community_posts;

-- Create Index for faster filtering by category and sorting by date
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON private_community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON private_community_posts(created_at DESC);
