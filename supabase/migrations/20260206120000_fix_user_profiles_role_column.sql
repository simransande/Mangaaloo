-- Fix user_profiles table to add missing role column
-- This migration ensures the role column exists before creating indexes

-- Add role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN role public.user_role DEFAULT 'customer'::public.user_role;
        
        RAISE NOTICE 'Added role column to user_profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists in user_profiles table';
    END IF;
END $$;

-- Create index on role column (will succeed now that column exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Update existing users without role to have customer role
UPDATE public.user_profiles 
SET role = 'customer'::public.user_role 
WHERE role IS NULL;
