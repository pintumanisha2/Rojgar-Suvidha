-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO CLEAR OLD TEST ACCOUNTS
-- This will delete all users who have an employer_profile.
-- Use this to reset your testing environment.

DELETE FROM auth.users 
WHERE id IN (
  SELECT user_id FROM public.employer_profiles
);

DELETE FROM public.employer_profiles;
