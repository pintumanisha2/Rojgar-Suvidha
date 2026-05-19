-- ==========================================
-- Supabase Setup Script for Aspirants Adda
-- Run this in your Supabase Dashboard SQL Editor
-- ==========================================

-- 1. Update existing chat_messages table structure
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_poll BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS poll_question TEXT,
ADD COLUMN IF NOT EXISTS poll_options TEXT[],
ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0;

-- 2. Create the chat_poll_votes table for Daily Polls
CREATE TABLE IF NOT EXISTS chat_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES chat_users(id) ON DELETE CASCADE,
    selected_option TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_vote UNIQUE (message_id, user_id)
);

-- 3. Create the chat_reactions table for Emoji Reactions
CREATE TABLE IF NOT EXISTS chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES chat_users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_reaction UNIQUE (message_id, user_id, reaction_type)
);

-- 4. Enable Row Level Security (RLS) on new tables
ALTER TABLE chat_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for chat_poll_votes
DROP POLICY IF EXISTS "Allow public read access to chat_poll_votes" ON chat_poll_votes;
CREATE POLICY "Allow public read access to chat_poll_votes"
ON chat_poll_votes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert to chat_poll_votes" ON chat_poll_votes;
CREATE POLICY "Allow public insert to chat_poll_votes"
ON chat_poll_votes FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to chat_poll_votes" ON chat_poll_votes;
CREATE POLICY "Allow public update to chat_poll_votes"
ON chat_poll_votes FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete to chat_poll_votes" ON chat_poll_votes;
CREATE POLICY "Allow public delete to chat_poll_votes"
ON chat_poll_votes FOR DELETE
USING (true);

-- 6. RLS Policies for chat_reactions
DROP POLICY IF EXISTS "Allow public read access to chat_reactions" ON chat_reactions;
CREATE POLICY "Allow public read access to chat_reactions"
ON chat_reactions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert to chat_reactions" ON chat_reactions;
CREATE POLICY "Allow public insert to chat_reactions"
ON chat_reactions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete to chat_reactions" ON chat_reactions;
CREATE POLICY "Allow public delete to chat_reactions"
ON chat_reactions FOR DELETE
USING (true);

-- 7. Add UPDATE policies to chat_messages and chat_users if not exists
-- (Required so admins can pin/delete and users can vote/report/register)
DROP POLICY IF EXISTS "Allow public update access to chat_messages" ON chat_messages;
CREATE POLICY "Allow public update access to chat_messages"
ON chat_messages FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to chat_users" ON chat_users;
CREATE POLICY "Allow public update access to chat_users"
ON chat_users FOR UPDATE
USING (true)
WITH CHECK (true);
