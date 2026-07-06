-- =====================================================================
-- 🎥 ROJGAR SUVIDHA — SILENT VIDEO CO-STUDY ROOM SETUP
-- Execute this script in your Supabase SQL Editor (dashboard.supabase.com)
-- =====================================================================

-- 1. Create Study Rooms Table
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- 'ssc', 'upsc', 'railway', 'banking', 'defence', 'general'
    theme_name TEXT DEFAULT 'library', -- 'library', 'cafe', 'forest', 'space'
    max_capacity INTEGER DEFAULT 6,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Active Participants Table
CREATE TABLE IF NOT EXISTS public.study_session_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    target_task TEXT DEFAULT 'Studying',
    camera_active BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_room UNIQUE(user_id) -- User can join only 1 room at a time
);

-- 3. Create Flags / Reports Table
CREATE TABLE IF NOT EXISTS public.study_room_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_session_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_reports ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies for public.study_rooms
-- Allow anyone to read rooms
DROP POLICY IF EXISTS "Allow public read study_rooms" ON public.study_rooms;
CREATE POLICY "Allow public read study_rooms" ON public.study_rooms
    FOR SELECT USING (true);

-- Allow authenticated users to insert a room
DROP POLICY IF EXISTS "Allow authenticated insert study_rooms" ON public.study_rooms;
CREATE POLICY "Allow authenticated insert study_rooms" ON public.study_rooms
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow admins or creators to update/delete rooms
DROP POLICY IF EXISTS "Allow creators and admins to update study_rooms" ON public.study_rooms;
CREATE POLICY "Allow creators and admins to update study_rooms" ON public.study_rooms
    FOR ALL TO authenticated USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM public.admin_roles WHERE email = auth.jwt() ->> 'email' AND role IN ('admin', 'super_admin') AND status = 'Active'
    ));

-- 6. Set up RLS Policies for public.study_session_users
-- Allow anyone to read active participants
DROP POLICY IF EXISTS "Allow public read study_session_users" ON public.study_session_users;
CREATE POLICY "Allow public read study_session_users" ON public.study_session_users
    FOR SELECT USING (true);

-- Allow authenticated users to manage their own sessions (join/leave)
DROP POLICY IF EXISTS "Allow users to manage their own study sessions" ON public.study_session_users;
CREATE POLICY "Allow users to manage their own study sessions" ON public.study_session_users
    FOR ALL TO authenticated USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.admin_roles WHERE email = auth.jwt() ->> 'email' AND role IN ('admin', 'super_admin') AND status = 'Active'
    )) WITH CHECK (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.admin_roles WHERE email = auth.jwt() ->> 'email' AND role IN ('admin', 'super_admin') AND status = 'Active'
    ));

-- 7. Set up RLS Policies for public.study_room_reports
-- Allow authenticated users to file a report
DROP POLICY IF EXISTS "Allow authenticated to insert reports" ON public.study_room_reports;
CREATE POLICY "Allow authenticated to insert reports" ON public.study_room_reports
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Allow only Admins to read/delete reports
DROP POLICY IF EXISTS "Allow only admins to manage reports" ON public.study_room_reports;
CREATE POLICY "Allow only admins to manage reports" ON public.study_room_reports
    FOR ALL TO authenticated USING (EXISTS (
        SELECT 1 FROM public.admin_roles WHERE email = auth.jwt() ->> 'email' AND role IN ('admin', 'super_admin') AND status = 'Active'
    ));

-- 8. Seed some initial public permanent tables
INSERT INTO public.study_rooms (id, name, category, theme_name, max_capacity)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '🏛️ SSC Exam Hall 1', 'ssc', 'library', 6),
  ('00000000-0000-0000-0000-000000000002', '🏛️ SSC Exam Hall 2', 'ssc', 'library', 6),
  ('00000000-0000-0000-0000-000000000003', '🚂 Railway Speed Cabin 1', 'railway', 'cafe', 6),
  ('00000000-0000-0000-0000-000000000004', '🚂 Railway Speed Cabin 2', 'railway', 'cafe', 6),
  ('00000000-0000-0000-0000-000000000005', '🎖️ UPSC Silent Sanctuary', 'upsc', 'forest', 6),
  ('00000000-0000-0000-0000-000000000006', '🏦 Banking Target Table', 'banking', 'space', 6)
ON CONFLICT (id) DO NOTHING;
