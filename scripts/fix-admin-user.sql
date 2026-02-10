-- Fix Admin User Script
-- Run this in your Supabase SQL Editor to ensure admin user has correct role

-- First, check if admin user exists in auth.users
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get admin user ID from auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@mangaaloo.com';

    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found in auth.users. Please create user through Supabase Dashboard first.';
        RAISE NOTICE 'Email: admin@mangaaloo.com';
        RAISE NOTICE 'Password: Admin@123';
    ELSE
        RAISE NOTICE 'Admin user found with ID: %', admin_user_id;
        
        -- Ensure user profile exists with admin role
        INSERT INTO public.user_profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'admin@mangaaloo.com',
            'Admin User',
            'admin',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'admin',
            full_name = 'Admin User',
            email = 'admin@mangaaloo.com',
            updated_at = NOW();

        RAISE NOTICE 'Admin user profile updated successfully with admin role';
    END IF;
END $$;

-- Verify the admin user
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.role,
    up.full_name
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'admin@mangaaloo.com';
