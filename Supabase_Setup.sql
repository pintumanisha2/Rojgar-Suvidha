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

-- ==========================================
-- 8. Recruiter Portal Schema Updates for Private Sector Jobs
-- ==========================================

CREATE TABLE IF NOT EXISTS employer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    hr_name TEXT NOT NULL,
    website TEXT,
    email TEXT UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    gst_number TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Migrations for existing tables
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add employer_id foreign key to jobs if it doesn't exist
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS on employer_profiles
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employer_profiles
DROP POLICY IF EXISTS "Allow public read access to employer_profiles" ON employer_profiles;
CREATE POLICY "Allow public read access to employer_profiles"
ON employer_profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow employers to insert their own profile" ON employer_profiles;
CREATE POLICY "Allow employers to insert their own profile"
ON employer_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow employers to update their own profile" ON employer_profiles;
CREATE POLICY "Allow employers to update their own profile"
ON employer_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RLS Policies for jobs
DROP POLICY IF EXISTS "Allow employers to insert new pending jobs" ON jobs;
CREATE POLICY "Allow employers to insert new pending jobs"
ON jobs FOR INSERT
WITH CHECK (
    employer_id = auth.uid() 
    AND status = 'pending_approval'
    AND EXISTS (
        SELECT 1 FROM employer_profiles 
        WHERE id = auth.uid() AND is_verified = true
    )
);

DROP POLICY IF EXISTS "Allow employers to close their own jobs" ON jobs;
CREATE POLICY "Allow employers to close their own jobs"
ON jobs FOR UPDATE
USING (employer_id = auth.uid())
WITH CHECK (employer_id = auth.uid());

-- ==========================================
-- 9. Private Sector Candidate Workspace & LinkedIn-Style Messaging
-- ==========================================

-- Private Sector Candidate Profiles Table
CREATE TABLE IF NOT EXISTS private_candidate_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    skills TEXT[] DEFAULT '{}',
    experience TEXT,
    college TEXT,
    bio TEXT,
    desired_role TEXT,
    preferred_location TEXT,
    expected_ctc TEXT,
    resume_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on private_candidate_profiles
ALTER TABLE private_candidate_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for private_candidate_profiles
DROP POLICY IF EXISTS "Allow public read of profiles" ON private_candidate_profiles;
CREATE POLICY "Allow public read of profiles" 
ON private_candidate_profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow candidates to manage their own profile" ON private_candidate_profiles;
CREATE POLICY "Allow candidates to manage their own profile" 
ON private_candidate_profiles FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Private Messaging Table (Recruiters <-> Candidates)
CREATE TABLE IF NOT EXISTS private_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('employer', 'candidate')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on private_messages
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Policies for private_messages
DROP POLICY IF EXISTS "Allow users to read their own messages" ON private_messages;
CREATE POLICY "Allow users to read their own messages" 
ON private_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Allow users to send messages" ON private_messages;
CREATE POLICY "Allow users to send messages" 
ON private_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Safe migrations to add new fields if the table already existed
ALTER TABLE private_candidate_profiles ADD COLUMN IF NOT EXISTS desired_role TEXT;
ALTER TABLE private_candidate_profiles ADD COLUMN IF NOT EXISTS preferred_location TEXT;
ALTER TABLE private_candidate_profiles ADD COLUMN IF NOT EXISTS expected_ctc TEXT;
ALTER TABLE private_candidate_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;

