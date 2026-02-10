-- QUICK FIX: Set admin role for admin@mangaaloo.com
-- Copy and paste this into Supabase SQL Editor and click RUN

UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'admin@mangaaloo.com';

-- Verify it worked:
SELECT email, role FROM public.user_profiles WHERE email = 'admin@mangaaloo.com';
