-- ============================================================
-- Rojgar Suvidha — COMPLETE SUPABASE DATABASE SETUP SCHEMA
-- Run this script in your Supabase Dashboard -> SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION 1: PUBLIC PORTAL TABLES (Main Site)
-- ─────────────────────────────────────────────────────────────

-- 1. profiles (General Candidate profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  date_of_birth DATE,
  mobile_number TEXT,
  father_name TEXT,
  mother_name TEXT,
  gender TEXT,
  category TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to manage their own profile" ON public.profiles;
CREATE POLICY "Allow users to manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- 2. admin_roles (Authorizes access for admin, staff, and content writers)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL, -- 'admin', 'content_writer', 'staff'
  name TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to admin_roles" ON public.admin_roles;
CREATE POLICY "Allow public read access to admin_roles" ON public.admin_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins have full access to admin_roles" ON public.admin_roles;
CREATE POLICY "Admins have full access to admin_roles" ON public.admin_roles FOR ALL USING (true) WITH CHECK (true);


-- 3. jobs (Govt jobs, admit cards, results, blogs)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'latest-jobs', 'admit-card', 'result', etc.
  status TEXT DEFAULT 'draft', -- 'draft', 'pending_approval', 'published'
  state_code TEXT,
  tag TEXT,
  short_info TEXT,
  meta_description TEXT,
  banner_url TEXT,
  blog_content TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  important_dates JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  employer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to published jobs" ON public.jobs;
CREATE POLICY "Allow public read access to published jobs" ON public.jobs 
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins and writers have access to jobs" ON public.jobs;
CREATE POLICY "Admins and writers have access to jobs" ON public.jobs 
  FOR ALL USING (true) WITH CHECK (true);


-- 4. apply_for_me_requests (Locker/Form application service)
CREATE TABLE IF NOT EXISTS public.apply_for_me_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'submitted', 'rejected'
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.apply_for_me_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and insert own requests" ON public.apply_for_me_requests;
CREATE POLICY "Users can view and insert own requests" ON public.apply_for_me_requests 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view and update all requests" ON public.apply_for_me_requests;
CREATE POLICY "Admins can view and update all requests" ON public.apply_for_me_requests 
  FOR ALL USING (true) WITH CHECK (true);


-- 5. banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  title TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for banners" ON public.banners;
CREATE POLICY "Public read for banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for banners" ON public.banners;
CREATE POLICY "Admin full access for banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);


-- 6. tickers
CREATE TABLE IF NOT EXISTS public.tickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  link_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tickers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for tickers" ON public.tickers;
CREATE POLICY "Public read for tickers" ON public.tickers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for tickers" ON public.tickers;
CREATE POLICY "Admin full access for tickers" ON public.tickers FOR ALL USING (true) WITH CHECK (true);


-- 7. custom_forms
CREATE TABLE IF NOT EXISTS public.custom_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for custom_forms" ON public.custom_forms;
CREATE POLICY "Public read for custom_forms" ON public.custom_forms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for custom_forms" ON public.custom_forms;
CREATE POLICY "Admin full access for custom_forms" ON public.custom_forms FOR ALL USING (true) WITH CHECK (true);


-- 8. user_applications
CREATE TABLE IF NOT EXISTS public.user_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submission_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own submissions" ON public.user_applications;
CREATE POLICY "Users can manage own submissions" ON public.user_applications 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access for user_applications" ON public.user_applications;
CREATE POLICY "Admin full access for user_applications" ON public.user_applications 
  FOR ALL USING (true) WITH CHECK (true);


-- 9. push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  subscription_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 10. complaints
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and insert own complaints" ON public.complaints;
CREATE POLICY "Users can view and insert own complaints" ON public.complaints 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access for complaints" ON public.complaints;
CREATE POLICY "Admin full access for complaints" ON public.complaints 
  FOR ALL USING (true) WITH CHECK (true);


-- 11. analytics
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for analytics" ON public.analytics;
CREATE POLICY "Admin full access for analytics" ON public.analytics FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- SECTION 2: PRIVATE PORTAL & COMMUNITY SETUP
-- ─────────────────────────────────────────────────────────────

-- 12. private_jobs (Private sector postings)
CREATE TABLE IF NOT EXISTS public.private_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  company_name        TEXT NOT NULL,
  location            TEXT DEFAULT 'India',
  salary              TEXT,
  experience_required TEXT,
  description         TEXT,
  skills_required     TEXT[] DEFAULT '{}',
  employer_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  posted_by           TEXT DEFAULT 'system_scout',
  apply_mode          TEXT DEFAULT 'internal',
  source_url          TEXT,
  source_site         TEXT DEFAULT 'External',
  status              TEXT DEFAULT 'pending', -- 'pending', 'published', 'rejected'
  is_featured         BOOLEAN DEFAULT false,
  company_logo        TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.private_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published private jobs" ON public.private_jobs;
CREATE POLICY "Public can read published private jobs" ON public.private_jobs 
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins have full access to private_jobs" ON public.private_jobs;
CREATE POLICY "Admins have full access to private_jobs" ON public.private_jobs 
  FOR ALL USING (true) WITH CHECK (true);


-- 13. employer_profiles
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name        TEXT NOT NULL,
  hr_name             TEXT NOT NULL,
  website             TEXT,
  email               TEXT UNIQUE NOT NULL,
  is_verified         BOOLEAN DEFAULT false,
  is_suspended        BOOLEAN DEFAULT false,
  gst_number          TEXT,
  phone               TEXT,
  logo_url            TEXT,
  description         TEXT,
  jobs_posted         INT DEFAULT 0,
  company_id_card_url TEXT,
  email_templates     JSONB DEFAULT '{"rejection": "Hi {{candidate_name}},\n\nThank you for applying to {{company_name}}. Unfortunately, we have decided to move forward with other candidates at this time.\n\nBest,\nHR Team", "interview": "Hi {{candidate_name}},\n\nWe would love to schedule an interview with you for the {{job_title}} role at {{company_name}}.\n\nPlease join using the following link at the scheduled time: {{meeting_link}}\n\nBest,\nHR Team"}'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to employer_profiles" ON public.employer_profiles;
CREATE POLICY "Allow public read access to employer_profiles" ON public.employer_profiles 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow employers to insert their own profile" ON public.employer_profiles;
CREATE POLICY "Allow employers to insert their own profile" ON public.employer_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow employers to update their own profile" ON public.employer_profiles;
CREATE POLICY "Allow employers to update their own profile" ON public.employer_profiles 
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins manage all employer_profiles" ON public.employer_profiles;
CREATE POLICY "Admins manage all employer_profiles" ON public.employer_profiles 
  FOR ALL USING (true) WITH CHECK (true);


-- 14. private_candidate_profiles
CREATE TABLE IF NOT EXISTS public.private_candidate_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  skills              TEXT[] DEFAULT '{}',
  experience          TEXT,
  college             TEXT,
  bio                 TEXT,
  desired_role        TEXT,
  preferred_location  TEXT,
  expected_ctc        TEXT,
  avatar_url          TEXT,
  resume_url          TEXT,
  portfolio_url       TEXT,
  video_pitch_url     TEXT,
  hackerrank_url      TEXT,
  leetcode_url        TEXT,
  certifications      TEXT,
  ats_score           INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.private_candidate_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of profiles" ON public.private_candidate_profiles;
CREATE POLICY "Allow public read of profiles" ON public.private_candidate_profiles 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow candidates to manage their own profile" ON public.private_candidate_profiles;
CREATE POLICY "Allow candidates to manage their own profile" ON public.private_candidate_profiles 
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins manage all candidates" ON public.private_candidate_profiles;
CREATE POLICY "Admins manage all candidates" ON public.private_candidate_profiles 
  FOR ALL USING (true) WITH CHECK (true);


-- 15. private_job_applications (ATS tracking)
CREATE TABLE IF NOT EXISTS public.private_job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'applied', -- 'applied', 'shortlisted', 'interview', 'hired', 'rejected'
    cover_letter TEXT,
    ats_score INTEGER DEFAULT 0,
    resume_url TEXT,
    scorecard JSONB DEFAULT '{"communication": 0, "technical": 0, "culture": 0, "notes": ""}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.private_job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can read own applications" ON public.private_job_applications;
CREATE POLICY "Candidates can read own applications" ON public.private_job_applications 
  FOR SELECT USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Candidates can insert applications" ON public.private_job_applications;
CREATE POLICY "Candidates can insert applications" ON public.private_job_applications 
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Employers can read applications for their jobs" ON public.private_job_applications;
CREATE POLICY "Employers can read applications for their jobs" ON public.private_job_applications 
  FOR SELECT USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Employers can update application status" ON public.private_job_applications;
CREATE POLICY "Employers can update application status" ON public.private_job_applications 
  FOR UPDATE USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);


-- 16. private_job_applications_internal (1-Click Internal application parser)
CREATE TABLE IF NOT EXISTS public.private_job_applications_internal (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              UUID REFERENCES public.private_jobs(id) ON DELETE SET NULL,
  job_title           TEXT NOT NULL,
  company_name        TEXT,
  applicant_name      TEXT NOT NULL,
  applicant_email     TEXT NOT NULL,
  applicant_phone     TEXT NOT NULL,
  cover_note          TEXT,
  resume_url          TEXT,
  status              TEXT DEFAULT 'new', -- 'new', 'contacted', 'shortlisted', 'rejected'
  feedback            TEXT,
  candidate_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.private_job_applications_internal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit an internal application" ON public.private_job_applications_internal;
CREATE POLICY "Anyone can submit an internal application" ON public.private_job_applications_internal 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Candidates can see own applications" ON public.private_job_applications_internal;
CREATE POLICY "Candidates can see own applications" ON public.private_job_applications_internal 
  FOR SELECT USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Admins can manage all applications" ON public.private_job_applications_internal;
CREATE POLICY "Admins can manage all applications" ON public.private_job_applications_internal 
  FOR ALL USING (true) WITH CHECK (true);


-- 17. profile_visits
CREATE TABLE IF NOT EXISTS public.profile_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    visited_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can see their profile visits" ON public.profile_visits;
CREATE POLICY "Candidates can see their profile visits" ON public.profile_visits 
  FOR SELECT USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Employers can record a visit" ON public.profile_visits;
CREATE POLICY "Employers can record a visit" ON public.profile_visits 
  FOR INSERT WITH CHECK (true);


-- 18. private_messages
CREATE TABLE IF NOT EXISTS public.private_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('employer', 'candidate')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own messages" ON public.private_messages;
CREATE POLICY "Allow users to read their own messages" ON public.private_messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Allow users to send messages" ON public.private_messages;
CREATE POLICY "Allow users to send messages" ON public.private_messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- 19. private_community_posts
CREATE TABLE IF NOT EXISTS public.private_community_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content             TEXT NOT NULL,
  category            TEXT DEFAULT 'General',
  is_blocked          BOOLEAN DEFAULT false,
  author_name         TEXT NOT NULL,
  author_avatar       TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.private_community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active community posts" ON public.private_community_posts;
CREATE POLICY "Public can read active community posts" ON public.private_community_posts 
  FOR SELECT USING (is_blocked = false);

DROP POLICY IF EXISTS "Authenticated users can insert posts" ON public.private_community_posts;
CREATE POLICY "Authenticated users can insert posts" ON public.private_community_posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage community posts" ON public.private_community_posts;
CREATE POLICY "Admins manage community posts" ON public.private_community_posts 
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for community posts
ALTER PUBLICATION supabase_realtime ADD TABLE private_community_posts;


-- 20. chat_users table
CREATE TABLE IF NOT EXISTS public.chat_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'user', -- 'user', 'admin'
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to chat_users" ON public.chat_users;
CREATE POLICY "Allow public read access to chat_users" ON public.chat_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert/update own chat profile" ON public.chat_users;
CREATE POLICY "Allow authenticated users to insert/update own chat profile" ON public.chat_users 
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow public update access to chat_users" ON public.chat_users;
CREATE POLICY "Allow public update access to chat_users" ON public.chat_users FOR UPDATE USING (true) WITH CHECK (true);


-- 20.5 chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.chat_users(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_poll BOOLEAN DEFAULT false,
    poll_question TEXT,
    poll_options TEXT[],
    reports_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to chat_messages" ON public.chat_messages;
CREATE POLICY "Allow public read access to chat_messages" ON public.chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.chat_messages;
CREATE POLICY "Allow authenticated users to insert messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public update access to chat_messages" ON public.chat_messages;
CREATE POLICY "Allow public update access to chat_messages" ON public.chat_messages FOR UPDATE USING (true) WITH CHECK (true);


-- 20.6 chat_poll_votes & chat_reactions (Supabase_Setup.sql dependencies)
CREATE TABLE IF NOT EXISTS public.chat_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.chat_users(id) ON DELETE CASCADE,
    selected_option TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_vote UNIQUE (message_id, user_id)
);

ALTER TABLE public.chat_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to chat_poll_votes" ON public.chat_poll_votes FOR SELECT USING (true);
CREATE POLICY "Allow public insert to chat_poll_votes" ON public.chat_poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to chat_poll_votes" ON public.chat_poll_votes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete to chat_poll_votes" ON public.chat_poll_votes FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.chat_users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_reaction UNIQUE (message_id, user_id, reaction_type)
);

ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to chat_reactions" ON public.chat_reactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to chat_reactions" ON public.chat_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete to chat_reactions" ON public.chat_reactions FOR DELETE USING (true);



-- 21. employer_interviews
CREATE TABLE IF NOT EXISTS public.employer_interviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id         UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  employer_uid        TEXT,
  candidate_name      TEXT NOT NULL,
  candidate_email     TEXT,
  job_role            TEXT,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INTEGER DEFAULT 45,
  meeting_type        TEXT DEFAULT 'Video Call',
  room_id             TEXT,
  status              TEXT DEFAULT 'scheduled',
  created_at          TIMESTAMPTZ DEFAULT now()
);


-- 22. employer_team_members
CREATE TABLE IF NOT EXISTS public.employer_team_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_uid        TEXT NOT NULL,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  role                TEXT DEFAULT 'Technical Interviewer',
  status              TEXT DEFAULT 'Pending Invite',
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_team_member_email ON public.employer_team_members (employer_uid, email);


-- 23. employer_activity_logs
CREATE TABLE IF NOT EXISTS public.employer_activity_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_uid        TEXT NOT NULL,
  user_name           TEXT NOT NULL,
  action_type         TEXT NOT NULL,
  target_details      TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_employer ON public.employer_activity_logs (employer_uid);


-- ─────────────────────────────────────────────────────────────
-- SECTION 3: INDEXES & SEED DATA
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_private_jobs_status         ON public.private_jobs (status);
CREATE INDEX IF NOT EXISTS idx_private_jobs_featured       ON public.private_jobs (is_featured DESC);
CREATE INDEX IF NOT EXISTS idx_private_jobs_apply_mode     ON public.private_jobs (apply_mode);
CREATE INDEX IF NOT EXISTS idx_private_jobs_posted_by      ON public.private_jobs (posted_by);
CREATE INDEX IF NOT EXISTS idx_applications_email          ON public.private_job_applications_internal (applicant_email);
CREATE INDEX IF NOT EXISTS idx_applications_job_id         ON public.private_job_applications_internal (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status         ON public.private_job_applications_internal (status);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user     ON public.private_candidate_profiles (id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_verified  ON public.employer_profiles (is_verified);

-- Seed some sample jobs for immediate testing
INSERT INTO public.private_jobs (title, company_name, location, salary, experience_required, skills_required, description, source_url, source_site, posted_by, apply_mode, status, is_featured)
VALUES
  (
    'Senior React Developer',
    'Flipkart',
    'Bangalore, KA (Hybrid)',
    '₹18L – ₹28L /yr',
    '4+ Years',
    ARRAY['React', 'TypeScript', 'GraphQL', 'Node.js'],
    'Build and maintain high-performance consumer-facing React apps for millions of users. Work with cross-functional teams to deliver world-class UX. Strong experience with state management, performance optimization, and component libraries required.',
    'https://naukri.com',
    'Naukri',
    'system_scout',
    'internal',
    'published',
    true
  ),
  (
    'Python Data Engineer',
    'Razorpay',
    'Remote',
    '₹20L – ₹32L /yr',
    '3+ Years',
    ARRAY['Python', 'Apache Spark', 'Airflow', 'SQL', 'AWS'],
    'Design and maintain large-scale data pipelines powering payment analytics. Work on real-time data ingestion, transformation, and reporting systems that process millions of transactions daily.',
    'https://linkedin.com',
    'LinkedIn',
    'system_scout',
    'internal',
    'published',
    false
  ),
  (
    'Product Manager – Growth',
    'CRED',
    'Bangalore',
    '₹25L – ₹40L /yr',
    '5+ Years',
    ARRAY['Product Strategy', 'A/B Testing', 'SQL', 'Growth Hacking', 'Analytics'],
    'Lead product strategy for CRED growth initiatives. Drive experiments to improve user activation, retention, and monetization. Work closely with engineering, design, and data science teams.',
    'https://indeed.com',
    'Indeed',
    'system_scout',
    'internal',
    'published',
    true
  )
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- SECTION 4: STORAGE BUCKETS & POLICIES
-- ─────────────────────────────────────────────────────────────

-- Create required storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('employer_documents', 'employer_documents', true),
  ('blog_images', 'blog_images', true),
  ('avatars', 'avatars', true),
  ('banners', 'banners', true),
  ('student-documents', 'student-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any to prevent conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Access" ON storage.objects;

-- Create policies for storage
-- 1. Allow public select access to all buckets so users/visitors can view uploaded files
CREATE POLICY "Public Select Access" ON storage.objects
  FOR SELECT USING (true);

-- 2. Allow authenticated users to upload files to storage
CREATE POLICY "Auth Insert Access" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

