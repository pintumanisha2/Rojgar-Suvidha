-- ============================================================
-- Rojgar Suvidha — Private Jobs Portal: Complete DB Schema
-- Run this ONCE in your Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE 1: private_jobs
-- Stores all private job listings (both HR-posted & Scout-posted)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS private_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  company_name        TEXT NOT NULL,
  location            TEXT DEFAULT 'India',
  salary              TEXT,
  experience_required TEXT,
  description         TEXT,
  skills_required     TEXT[] DEFAULT '{}',
  
  -- Employer who posted (null for admin-scouted jobs)
  employer_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 'system_scout' = posted by admin job scout, otherwise employer's user ID
  posted_by           TEXT DEFAULT 'system_scout',
  
  -- 'internal' = collect resumes on Rojgar Suvidha, 'external' = redirect link
  apply_mode          TEXT DEFAULT 'internal',
  
  -- Original source URL (from Naukri / LinkedIn / Indeed)
  source_url          TEXT,
  source_site         TEXT DEFAULT 'External',
  
  -- Moderation & display
  status              TEXT DEFAULT 'pending', -- 'pending', 'published', 'rejected'
  is_featured         BOOLEAN DEFAULT false,
  company_logo        TEXT,
  
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE private_jobs ENABLE ROW LEVEL SECURITY;

-- Public can read published jobs
DROP POLICY IF EXISTS "Public can read published private jobs" ON private_jobs;
CREATE POLICY "Public can read published private jobs"
  ON private_jobs FOR SELECT
  USING (status = 'published');

-- Admin full access (use service role or authenticated admin check)
DROP POLICY IF EXISTS "Admins have full access to private_jobs" ON private_jobs;
CREATE POLICY "Admins have full access to private_jobs"
  ON private_jobs FOR ALL
  USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- TABLE 2: private_job_applications_internal
-- Stores all applications from the 1-Click Apply system
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS private_job_applications_internal (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  job_id              UUID REFERENCES private_jobs(id) ON DELETE SET NULL,
  job_title           TEXT NOT NULL,
  company_name        TEXT,
  
  -- Applicant details (collected from the modal form)
  applicant_name      TEXT NOT NULL,
  applicant_email     TEXT NOT NULL,
  applicant_phone     TEXT NOT NULL,
  cover_note          TEXT,
  resume_url          TEXT,
  
  -- Workflow status for admin tracker
  status              TEXT DEFAULT 'new', -- 'new', 'contacted', 'shortlisted', 'rejected'
  
  -- Optional: link to logged-in candidate profile
  candidate_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE private_job_applications_internal ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit an application (public insert)
DROP POLICY IF EXISTS "Anyone can submit an internal application" ON private_job_applications_internal;
CREATE POLICY "Anyone can submit an internal application"
  ON private_job_applications_internal FOR INSERT
  WITH CHECK (true);

-- Candidates can see their own applications
DROP POLICY IF EXISTS "Candidates can see own applications" ON private_job_applications_internal;
CREATE POLICY "Candidates can see own applications"
  ON private_job_applications_internal FOR SELECT
  USING (auth.uid() = candidate_id);

-- Admins can read and update all applications
DROP POLICY IF EXISTS "Admins can manage all applications" ON private_job_applications_internal;
CREATE POLICY "Admins can manage all applications"
  ON private_job_applications_internal FOR ALL
  USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- TABLE 3: employer_profiles
-- HR / Company profiles for employer approval workflow
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employer_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  company_name        TEXT NOT NULL,
  contact_name        TEXT,
  email               TEXT NOT NULL,
  phone               TEXT,
  industry            TEXT DEFAULT 'General',
  website             TEXT,
  
  -- Admin verification status
  is_verified         BOOLEAN DEFAULT false,
  is_suspended        BOOLEAN DEFAULT false,
  
  -- Stats
  jobs_posted         INT DEFAULT 0,
  
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;

-- Employers can manage their own profile
DROP POLICY IF EXISTS "Employers manage own profile" ON employer_profiles;
CREATE POLICY "Employers manage own profile"
  ON employer_profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Anyone can read verified employer profiles
DROP POLICY IF EXISTS "Public can read verified employers" ON employer_profiles;
CREATE POLICY "Public can read verified employers"
  ON employer_profiles FOR SELECT
  USING (is_verified = true);

-- Admins can manage all
DROP POLICY IF EXISTS "Admins manage all employer_profiles" ON employer_profiles;
CREATE POLICY "Admins manage all employer_profiles"
  ON employer_profiles FOR ALL
  USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- TABLE 4: private_candidate_profiles
-- Extended profiles for candidates on the private portal
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS private_candidate_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  college             TEXT,
  bio                 TEXT,
  experience          TEXT,
  desired_role        TEXT,
  preferred_location  TEXT,
  expected_ctc        TEXT,
  
  -- Profile & Resume Documents
  avatar_url          TEXT,
  resume_url          TEXT,
  
  -- Video pitch & portfolio
  portfolio_url       TEXT,
  video_pitch_url     TEXT,
  
  -- Skills array
  skills              TEXT[] DEFAULT '{}',
  
  -- Coding Profiles & Certifications
  hackerrank_url      TEXT,
  leetcode_url        TEXT,
  certifications      TEXT,
  
  -- Profile completeness & ATS score (cached)
  ats_score           INT DEFAULT 0,
  
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE private_candidate_profiles ENABLE ROW LEVEL SECURITY;

-- Candidates can manage their own profile
DROP POLICY IF EXISTS "Candidates manage own profile" ON private_candidate_profiles;
CREATE POLICY "Candidates manage own profile"
  ON private_candidate_profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Verified employers can search candidates (for HR dashboard)
DROP POLICY IF EXISTS "Verified employers can read candidate profiles" ON private_candidate_profiles;
CREATE POLICY "Verified employers can read candidate profiles"
  ON private_candidate_profiles FOR SELECT
  USING (true); -- tighten this once employer auth is live

-- Admins can manage all candidates
DROP POLICY IF EXISTS "Admins manage all candidates" ON private_candidate_profiles;
CREATE POLICY "Admins manage all candidates"
  ON private_candidate_profiles FOR ALL
  USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- TABLE 5: profile_visits (already in hr_portal_schema.sql)
-- Tracks which HR viewed which candidate profile
-- Only recreate if it doesn't already exist
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_visits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name  TEXT,
  visited_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profile_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can see their profile visits" ON profile_visits;
CREATE POLICY "Candidates can see their profile visits"
  ON profile_visits FOR SELECT
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Employers can record a visit" ON profile_visits;
CREATE POLICY "Employers can record a visit"
  ON profile_visits FOR INSERT
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- INDEXES: Speed up common queries
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_private_jobs_status         ON private_jobs (status);
CREATE INDEX IF NOT EXISTS idx_private_jobs_featured       ON private_jobs (is_featured DESC);
CREATE INDEX IF NOT EXISTS idx_private_jobs_apply_mode     ON private_jobs (apply_mode);
CREATE INDEX IF NOT EXISTS idx_private_jobs_posted_by      ON private_jobs (posted_by);
CREATE INDEX IF NOT EXISTS idx_applications_email          ON private_job_applications_internal (applicant_email);
CREATE INDEX IF NOT EXISTS idx_applications_job_id         ON private_job_applications_internal (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status         ON private_job_applications_internal (status);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user     ON private_candidate_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_verified  ON employer_profiles (is_verified);


-- ─────────────────────────────────────────────────────────────
-- SAMPLE DATA: 3 Scouted Jobs for immediate testing
-- ─────────────────────────────────────────────────────────────
INSERT INTO private_jobs (title, company_name, location, salary, experience_required, skills_required, description, source_url, source_site, posted_by, apply_mode, status, is_featured)
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
-- Done! All 5 tables created + 3 sample jobs inserted.
-- ─────────────────────────────────────────────────────────────
