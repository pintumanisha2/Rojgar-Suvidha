-- =====================================================================
-- 📅 ROJGAR SUVIDHA — CALENDAR & CURRENT AFFAIRS DATABASE SETUP
-- Execute this script in your Supabase SQL Editor (dashboard.supabase.com)
-- =====================================================================

-- 1. Create Current Affairs Cache table
CREATE TABLE IF NOT EXISTS public.current_affairs_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,         -- 'upsc', 'ssc', 'railway', 'banking', 'defence', 'general'
    month_year TEXT NOT NULL,       -- Format: 'YYYY-MM' (e.g. '2026-07')
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.current_affairs_cache ENABLE ROW LEVEL SECURITY;

-- Create Policies for current_affairs_cache
-- Allow anyone to READ (Public Read)
CREATE POLICY "Allow public read access to current affairs"
    ON public.current_affairs_cache
    FOR SELECT
    USING (true);

-- Allow authenticated Admins to INSERT/UPDATE/DELETE
CREATE POLICY "Allow admins to manage current affairs"
    ON public.current_affairs_cache
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Storage Bucket Policies for 'blog_images'
-- If the bucket 'blog_images' does not exist, run this (uncomment if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('blog_images', 'blog_images', true);

-- Policy to allow anyone to read files from 'blog_images'
CREATE POLICY "Public Read Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'blog_images');

-- Policy to allow authenticated users to upload files into 'blog_images' (includes pdfs/ folder)
CREATE POLICY "Admin Upload Access"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'blog_images');

-- Policy to allow authenticated users to delete/update files in 'blog_images'
CREATE POLICY "Admin Modify Access"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'blog_images');

CREATE POLICY "Admin Delete Access"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'blog_images');
