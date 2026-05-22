-- ==========================================
-- Supabase Schema for HR Portal Advanced Features
-- Run this in your Supabase Dashboard SQL Editor
-- ==========================================

-- 1. Private Job Applications (ATS Tracking)
CREATE TABLE IF NOT EXISTS private_job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'applied', -- Options: 'applied', 'shortlisted', 'rejected', 'hired'
    cover_letter TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE private_job_applications ENABLE ROW LEVEL SECURITY;

-- Candidates can see their own applications
DROP POLICY IF EXISTS "Candidates can read own applications" ON private_job_applications;
CREATE POLICY "Candidates can read own applications"
ON private_job_applications FOR SELECT
USING (auth.uid() = candidate_id);

-- Candidates can apply to jobs
DROP POLICY IF EXISTS "Candidates can insert applications" ON private_job_applications;
CREATE POLICY "Candidates can insert applications"
ON private_job_applications FOR INSERT
WITH CHECK (auth.uid() = candidate_id);

-- Employers can read applications for their jobs
DROP POLICY IF EXISTS "Employers can read applications for their jobs" ON private_job_applications;
CREATE POLICY "Employers can read applications for their jobs"
ON private_job_applications FOR SELECT
USING (auth.uid() = employer_id);

-- Employers can update application status (Shortlist/Reject)
DROP POLICY IF EXISTS "Employers can update application status" ON private_job_applications;
CREATE POLICY "Employers can update application status"
ON private_job_applications FOR UPDATE
USING (auth.uid() = employer_id)
WITH CHECK (auth.uid() = employer_id);


-- 2. Profile Visits (Notifications for Candidates)
CREATE TABLE IF NOT EXISTS profile_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profile_visits ENABLE ROW LEVEL SECURITY;

-- Candidates can see who visited their profile
DROP POLICY IF EXISTS "Candidates can see their profile visits" ON profile_visits;
CREATE POLICY "Candidates can see their profile visits"
ON profile_visits FOR SELECT
USING (auth.uid() = candidate_id);

-- Employers can record a visit
DROP POLICY IF EXISTS "Employers can insert profile visits" ON profile_visits;
CREATE POLICY "Employers can insert profile visits"
ON profile_visits FOR INSERT
WITH CHECK (auth.uid() = employer_id);

-- Public insert override for testing purposes (since mock simulation might not have strict RLS)
-- Uncomment these if testing locally without full auth setup:
-- CREATE POLICY "Allow public insert to private_job_applications" ON private_job_applications FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public insert to profile_visits" ON profile_visits FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public select to private_job_applications" ON private_job_applications FOR SELECT USING (true);
-- CREATE POLICY "Allow public select to profile_visits" ON profile_visits FOR SELECT USING (true);
