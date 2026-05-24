-- 1. Update employer_profiles with branding & email template columns
ALTER TABLE employer_profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS email_templates JSONB DEFAULT '{"rejection": "Hi {{candidate_name}},\n\nThank you for applying to {{company_name}}. Unfortunately, we have decided to move forward with other candidates at this time.\n\nBest,\nHR Team", "interview": "Hi {{candidate_name}},\n\nWe would love to schedule an interview with you for the {{job_title}} role at {{company_name}}.\n\nPlease join using the following link at the scheduled time: {{meeting_link}}\n\nBest,\nHR Team"}'::jsonb;

-- 2. Update private_job_applications with ATS, Resume tracking, and Scorecards
ALTER TABLE private_job_applications
ADD COLUMN IF NOT EXISTS ats_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS scorecard JSONB DEFAULT '{"communication": 0, "technical": 0, "culture": 0, "notes": ""}'::jsonb;

-- Note: The status column already exists in private_job_applications.
-- We will use the existing status column for the Kanban board (e.g., 'applied', 'shortlisted', 'interview', 'hired', 'rejected').
