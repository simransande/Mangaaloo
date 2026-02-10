-- Migration: Fix admin user creation with proper password hashing
-- This migration ensures admin user is created correctly for authentication

-- Note: Admin user should be created through Supabase Dashboard or Auth API
-- This migration is kept for reference but admin creation is commented out
-- to avoid pgcrypto issues during migration

DO $$
BEGIN
    RAISE NOTICE 'Admin user should be created through Supabase Dashboard';
    RAISE NOTICE 'Email: admin@mangaaloo.com';
    RAISE NOTICE 'Password: Admin@123';
    RAISE NOTICE 'After creating, update user_profiles.role to admin';
END $$;
