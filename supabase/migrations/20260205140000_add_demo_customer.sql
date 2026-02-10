-- Migration: Add demo customer user for testing
-- This migration creates a demo customer user with credentials:
-- Email: customer@example.com
-- Password: password123

-- Note: Demo customer should be created through Supabase Dashboard or Auth API
-- This migration is kept for reference but customer creation is commented out
-- to avoid pgcrypto issues during migration

DO $$
BEGIN
    RAISE NOTICE 'Demo customer should be created through Supabase Dashboard';
    RAISE NOTICE 'Email: customer@example.com';
    RAISE NOTICE 'Password: password123';
END $$;