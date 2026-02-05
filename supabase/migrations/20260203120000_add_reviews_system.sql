-- Reviews and Ratings System Migration
-- Adds customer review functionality with moderation and verified purchase badges

-- ============================================================================
-- STEP 1: TYPES
-- ============================================================================

DROP TYPE IF EXISTS public.review_status CASCADE;
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================================
-- STEP 2: TABLES
-- ============================================================================

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status public.review_status DEFAULT 'pending'::public.review_status,
    is_verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- Review Moderation Logs Table
CREATE TABLE IF NOT EXISTS public.review_moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    previous_status public.review_status,
    new_status public.review_status NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_moderation_logs_review_id ON public.review_moderation_logs(review_id);

-- ============================================================================
-- STEP 4: FUNCTIONS (BEFORE RLS POLICIES)
-- ============================================================================

-- Function: Check if user has purchased the product
CREATE OR REPLACE FUNCTION public.has_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = p_user_id 
    AND oi.product_id = p_product_id
    AND o.status IN ('delivered'::public.order_status, 'shipped'::public.order_status)
)
$$;

-- Function: Auto-set verified purchase flag on review creation
CREATE OR REPLACE FUNCTION public.set_verified_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.is_verified_purchase := public.has_purchased_product(NEW.user_id, NEW.product_id);
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 5: ENABLE RLS
-- ============================================================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_moderation_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS POLICIES
-- ============================================================================

-- Reviews Policies
DROP POLICY IF EXISTS "public_can_read_approved_reviews" ON public.reviews;
CREATE POLICY "public_can_read_approved_reviews"
ON public.reviews
FOR SELECT
TO public
USING (status = 'approved'::public.review_status);

DROP POLICY IF EXISTS "users_can_create_own_reviews" ON public.reviews;
CREATE POLICY "users_can_create_own_reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_can_view_own_reviews" ON public.reviews;
CREATE POLICY "users_can_view_own_reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_can_update_own_pending_reviews" ON public.reviews;
CREATE POLICY "users_can_update_own_pending_reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending'::public.review_status)
WITH CHECK (user_id = auth.uid() AND status = 'pending'::public.review_status);

DROP POLICY IF EXISTS "users_can_delete_own_pending_reviews" ON public.reviews;
CREATE POLICY "users_can_delete_own_pending_reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending'::public.review_status);

DROP POLICY IF EXISTS "admin_full_access_reviews" ON public.reviews;
CREATE POLICY "admin_full_access_reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Review Moderation Logs Policies
DROP POLICY IF EXISTS "admin_full_access_moderation_logs" ON public.review_moderation_logs;
CREATE POLICY "admin_full_access_moderation_logs"
ON public.review_moderation_logs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- STEP 7: TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS set_verified_purchase_trigger ON public.reviews;
CREATE TRIGGER set_verified_purchase_trigger
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_verified_purchase();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 8: MOCK DATA
-- ============================================================================

DO $$
DECLARE
    existing_user_id UUID;
    existing_product_id UUID;
    admin_user_id UUID;
BEGIN
    -- Verify tables exist and get existing data
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
    ) THEN
        -- Get a customer user
        SELECT id INTO existing_user_id 
        FROM public.user_profiles 
        WHERE role = 'customer'::public.user_role 
        LIMIT 1;
        
        -- Get admin user
        SELECT id INTO admin_user_id 
        FROM public.user_profiles 
        WHERE role = 'admin'::public.user_role 
        LIMIT 1;
        
        -- Get a product
        SELECT id INTO existing_product_id 
        FROM public.products 
        LIMIT 1;
        
        IF existing_user_id IS NOT NULL AND existing_product_id IS NOT NULL THEN
            -- Create sample reviews
            INSERT INTO public.reviews (product_id, user_id, rating, title, content, status, is_verified_purchase)
            VALUES 
                (existing_product_id, existing_user_id, 5, 'Excellent Quality!', 'This product exceeded my expectations. The fabric is soft and comfortable. Highly recommended!', 'approved'::public.review_status, true),
                (existing_product_id, existing_user_id, 4, 'Good value for money', 'Nice product overall. Fits well and looks great. Would buy again.', 'approved'::public.review_status, false)
            ON CONFLICT (product_id, user_id) DO NOTHING;
            
            RAISE NOTICE 'Sample reviews created successfully';
        ELSE
            RAISE NOTICE 'No users or products found. Run previous migrations first.';
        END IF;
    ELSE
        RAISE NOTICE 'Required tables do not exist. Run previous migrations first.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;