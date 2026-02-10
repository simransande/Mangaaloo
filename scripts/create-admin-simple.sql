-- Create Admin User (Run in Supabase SQL Editor)
-- This creates the admin user if it doesn't exist

-- Step 1: Create the auth user (if not exists)
-- Note: You should create this user through Supabase Dashboard > Authentication > Add User
-- Email: admin@mangaaloo.com
-- Password: Admin@123
-- Confirm email: YES

-- Step 2: After creating user in dashboard, run this to set admin role:
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'admin@mangaaloo.com';

-- If user_profiles entry doesn't exist, create it:
INSERT INTO public.user_profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    id,
    'admin@mangaaloo.com',
    'Admin User',
    'admin',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'admin@mangaaloo.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', full_name = 'Admin User';

-- Verify:
SELECT u.email, up.role, up.full_name
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'admin@mangaaloo.com';
