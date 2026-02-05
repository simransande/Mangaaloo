-- Add customer_notes column to user_profiles table for admin relationship management
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS customer_notes TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.user_profiles.customer_notes IS 'Admin notes for customer relationship management';