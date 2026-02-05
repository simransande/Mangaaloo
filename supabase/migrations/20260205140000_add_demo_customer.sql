-- Migration: Add demo customer user for testing
-- This migration creates a demo customer user with credentials:
-- Email: customer@example.com
-- Password: password123

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    customer_user_uuid UUID;
    existing_customer_count INTEGER;
BEGIN
    -- Check if customer user already exists
    SELECT COUNT(*) INTO existing_customer_count
    FROM auth.users
    WHERE email = 'customer@example.com';

    -- Only create customer if doesn't exist
    IF existing_customer_count = 0 THEN
        -- Generate a new UUID for the customer user
        customer_user_uuid := gen_random_uuid();
        
        -- Create customer user in auth.users with properly hashed password
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
            customer_user_uuid,
            'authenticated',
            'authenticated',
            'customer@example.com',
            crypt('password123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Demo Customer","role":"customer"}'::jsonb,
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );

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
            customer_user_uuid::text,
            gen_random_uuid(),
            customer_user_uuid,
            format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', customer_user_uuid::text, 'customer@example.com')::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW()
        );

        -- Create user profile with customer role
        INSERT INTO public.user_profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            customer_user_uuid,
            'customer@example.com',
            'Demo Customer',
            'customer',
            NOW(),
            NOW()
        );

        -- Create customer record (will be handled by trigger, but adding explicitly for completeness)
        INSERT INTO public.customers (
            user_id,
            email,
            full_name,
            created_at,
            updated_at
        ) VALUES (
            customer_user_uuid,
            'customer@example.com',
            'Demo Customer',
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;

        RAISE NOTICE 'Demo customer user created successfully: customer@example.com / password123';
    ELSE
        RAISE NOTICE 'Demo customer user already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating demo customer user: %', SQLERRM;
        RAISE;
END $$;