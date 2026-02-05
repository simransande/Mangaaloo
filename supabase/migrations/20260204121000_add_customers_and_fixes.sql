-- Migration: Add customers table and fix data consistency
-- This migration adds a dedicated customers table for better customer management
-- and fixes authentication flow issues

-- ============================================================================
-- STEP 1: CREATE CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for customers table
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);

-- ============================================================================
-- STEP 2: MIGRATE EXISTING DATA TO CUSTOMERS TABLE
-- ============================================================================

-- Migrate existing customer data from user_profiles
INSERT INTO public.customers (user_id, email, full_name, phone, created_at, updated_at)
SELECT 
    id,
    email,
    full_name,
    phone,
    created_at,
    updated_at
FROM public.user_profiles
WHERE role = 'customer'::public.user_role
ON CONFLICT (email) DO NOTHING;

-- Update customer stats from orders
DO $$
DECLARE
    customer_record RECORD;
BEGIN
    FOR customer_record IN SELECT id, email FROM public.customers
    LOOP
        UPDATE public.customers
        SET 
            total_orders = (
                SELECT COUNT(*) 
                FROM public.orders 
                WHERE customer_email = customer_record.email
            ),
            total_spent = (
                SELECT COALESCE(SUM(final_amount), 0) 
                FROM public.orders 
                WHERE customer_email = customer_record.email
            )
        WHERE id = customer_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: ADD CUSTOMER_ID TO ORDERS TABLE
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- Link existing orders to customers
UPDATE public.orders o
SET customer_id = c.id
FROM public.customers c
WHERE o.customer_email = c.email;

-- ============================================================================
-- STEP 4: CREATE FUNCTION TO AUTO-CREATE CUSTOMER ON USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only create customer record if user role is customer
    IF NEW.role = 'customer'::public.user_role THEN
        INSERT INTO public.customers (user_id, email, full_name, phone)
        VALUES (NEW.id, NEW.email, NEW.full_name, NEW.phone)
        ON CONFLICT (email) DO UPDATE
        SET 
            user_id = EXCLUDED.user_id,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for auto-creating customer
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;
CREATE TRIGGER on_user_profile_created
AFTER INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_customer();

-- ============================================================================
-- STEP 5: CREATE FUNCTION TO UPDATE CUSTOMER STATS ON ORDER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update customer stats when order is created or updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.customers
        SET 
            total_orders = (
                SELECT COUNT(*) 
                FROM public.orders 
                WHERE customer_email = NEW.customer_email
                AND status != 'cancelled'::public.order_status
            ),
            total_spent = (
                SELECT COALESCE(SUM(final_amount), 0) 
                FROM public.orders 
                WHERE customer_email = NEW.customer_email
                AND status != 'cancelled'::public.order_status
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE email = NEW.customer_email;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for updating customer stats
DROP TRIGGER IF EXISTS on_order_change ON public.orders;
CREATE TRIGGER on_order_change
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_stats();

-- ============================================================================
-- STEP 6: RLS POLICIES FOR CUSTOMERS TABLE
-- ============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admin can view all customers
CREATE POLICY "Admin can view all customers"
ON public.customers
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'::public.user_role
    )
);

-- Admin can insert customers
CREATE POLICY "Admin can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'::public.user_role
    )
);

-- Admin can update customers
CREATE POLICY "Admin can update customers"
ON public.customers
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'::public.user_role
    )
);

-- Users can view their own customer record
CREATE POLICY "Users can view own customer record"
ON public.customers
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own customer record
CREATE POLICY "Users can update own customer record"
ON public.customers
FOR UPDATE
USING (user_id = auth.uid());