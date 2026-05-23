-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR

-- 1. Add ID Card URL column to Employer Profiles
ALTER TABLE employer_profiles 
ADD COLUMN IF NOT EXISTS company_id_card_url TEXT;

-- 2. Create the Storage Bucket for ID Cards
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employer_documents', 'employer_documents', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for the bucket
-- Allow public to read the files (so Admin can view them easily via URL)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'employer_documents' );

-- Allow authenticated users to upload their ID cards
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'employer_documents' AND auth.role() = 'authenticated' );
