-- Migration: Fix admin user creation with proper password hashing
-- This migration ensures admin user is created correctly for authentication

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_user_uuid UUID;
    existing_admin_id UUID;
BEGIN
    -- First, delete ALL existing profiles with admin email (handles orphaned profiles)
    DELETE FROM public.user_profiles
    WHERE email = 'admin@mangaaloo.com';
    
    RAISE NOTICE 'Deleted any existing admin profiles';

    -- Check if admin user already exists in auth
    SELECT id INTO existing_admin_id
    FROM auth.users
    WHERE email = 'admin@mangaaloo.com';

    -- If admin exists in auth, delete and recreate to ensure correct password
    IF existing_admin_id IS NOT NULL THEN
        -- Delete from identities first (foreign key constraint)
        DELETE FROM auth.identities WHERE user_id = existing_admin_id;
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = existing_admin_id;
        
        RAISE NOTICE 'Existing admin auth user deleted: %', existing_admin_id;
    END IF;

    -- Generate a new UUID for the admin user
    admin_user_uuid := gen_random_uuid();
    
    -- Create admin user in auth.users
    -- Using Supabase's expected password hash format
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        admin_user_uuid,
        'authenticated',
        'authenticated',
        'admin@mangaaloo.com',
        crypt('Admin@123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
        '{"full_name":"Admin User","role":"admin"}'::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create identity record for email authentication
    INSERT INTO auth.identities (
        provider_id,
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        admin_user_uuid::text,
        gen_random_uuid(),
        admin_user_uuid,
        format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', admin_user_uuid::text, 'admin@mangaaloo.com')::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;

    -- Create user profile with admin role using INSERT ... ON CONFLICT
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        admin_user_uuid,
        'admin@mangaaloo.com',
        'Admin User',
        'admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    RAISE NOTICE 'Admin user created successfully with email: admin@mangaaloo.com';
    RAISE NOTICE 'Admin user ID: %', admin_user_uuid;
    RAISE NOTICE 'Password: Admin@123';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin user: %', SQLERRM;
        RAISE;
END $$;
