-- Migration: Add default admin user for admin dashboard access
-- This migration creates a default admin user with credentials:
-- Email: admin@mangaaloo.com
-- Password: Admin@123

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_user_uuid UUID;
    existing_admin_count INTEGER;
BEGIN
    -- Check if admin user already exists
    SELECT COUNT(*) INTO existing_admin_count
    FROM auth.users
    WHERE email = 'admin@mangaaloo.com';

    -- Only create admin if doesn't exist
    IF existing_admin_count = 0 THEN
        -- Generate a new UUID for the admin user
        admin_user_uuid := gen_random_uuid();
        
        -- Create admin user in auth.users with properly hashed password
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            admin_user_uuid,
            'authenticated',
            'authenticated',
            'admin@mangaaloo.com',
            crypt('Admin@123', gen_salt('bf')),
            NOW(),
            NULL,
            '',
            NULL,
            '',
            NULL,
            '',
            '',
            NULL,
            NULL,
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Admin User","role":"admin"}',
            NULL,
            NOW(),
            NOW(),
            NULL,
            NULL,
            '',
            '',
            NULL,
            '',
            0,
            NULL,
            '',
            NULL,
            false,
            NULL
        );

        -- Create identity record for email authentication with provider_id
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
            admin_user_uuid,
            admin_user_uuid,
            format('{"sub":"%s","email":"%s"}', admin_user_uuid::text, 'admin@mangaaloo.com')::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW()
        );

        -- Create user profile with admin role
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
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin',
            full_name = 'Admin User';

        RAISE NOTICE 'Admin user created successfully: admin@mangaaloo.com / Admin@123';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin user: %', SQLERRM;
        RAISE;
END $$;