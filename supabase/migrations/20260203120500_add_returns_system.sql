-- Returns Management System Migration
-- Adds return requests, refund processing, status tracking, and reason categorization

-- ============================================================================
-- STEP 1: TYPES (ENUMs)
-- ============================================================================

DROP TYPE IF EXISTS public.return_status CASCADE;
CREATE TYPE public.return_status AS ENUM ('pending', 'approved', 'rejected', 'refunded', 'cancelled');

DROP TYPE IF EXISTS public.return_reason CASCADE;
CREATE TYPE public.return_reason AS ENUM (
  'defective',
  'wrong_item',
  'size_issue',
  'quality_issue',
  'not_as_described',
  'changed_mind',
  'damaged_in_transit',
  'other'
);

-- ============================================================================
-- STEP 2: RETURNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number TEXT NOT NULL UNIQUE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    reason public.return_reason NOT NULL,
    reason_details TEXT,
    status public.return_status DEFAULT 'pending'::public.return_status,
    refund_amount DECIMAL(10, 2) NOT NULL,
    refund_processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns if they don't exist (for existing returns table)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'returns' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.returns 
        ADD COLUMN status public.return_status DEFAULT 'pending'::public.return_status;
        
        RAISE NOTICE 'Added status column to returns table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'returns' 
        AND column_name = 'reason'
    ) THEN
        ALTER TABLE public.returns 
        ADD COLUMN reason public.return_reason;
        
        RAISE NOTICE 'Added reason column to returns table';
    END IF;
END $$;

-- Return Items Table (tracks which items from order are being returned)
CREATE TABLE IF NOT EXISTS public.return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON public.returns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_return_number ON public.returns(return_number);

CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON public.return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_order_item_id ON public.return_items(order_item_id);

-- ============================================================================
-- STEP 4: ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- Returns Policies
DROP POLICY IF EXISTS "Users can view their own returns" ON public.returns;
CREATE POLICY "Users can view their own returns" ON public.returns
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own returns" ON public.returns;
CREATE POLICY "Users can create their own returns" ON public.returns
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all returns" ON public.returns;
CREATE POLICY "Admins can view all returns" ON public.returns
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'::public.user_role
        )
    );

DROP POLICY IF EXISTS "Admins can update returns" ON public.returns;
CREATE POLICY "Admins can update returns" ON public.returns
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'::public.user_role
        )
    );

-- Return Items Policies
DROP POLICY IF EXISTS "Users can view their own return items" ON public.return_items;
CREATE POLICY "Users can view their own return items" ON public.return_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.returns
            WHERE returns.id = return_items.return_id AND returns.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create their own return items" ON public.return_items;
CREATE POLICY "Users can create their own return items" ON public.return_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.returns
            WHERE returns.id = return_items.return_id AND returns.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all return items" ON public.return_items;
CREATE POLICY "Admins can view all return items" ON public.return_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'::public.user_role
        )
    );

-- ============================================================================
-- STEP 5: FUNCTIONS
-- ============================================================================

-- Function to generate return number
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    counter := (SELECT COUNT(*) FROM public.returns) + 1;
    new_number := 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate return number
CREATE OR REPLACE FUNCTION public.set_return_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
        NEW.return_number := public.generate_return_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_return_number ON public.returns;
CREATE TRIGGER trigger_set_return_number
    BEFORE INSERT ON public.returns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_return_number();

-- ============================================================================
-- STEP 6: MOCK DATA
-- ============================================================================

DO $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_return_id UUID;
    v_order_item_id UUID;
BEGIN
    -- Get existing order and user for mock returns
    SELECT id, user_id INTO v_order_id, v_user_id
    FROM public.orders
    WHERE status = 'delivered'::public.order_status
    LIMIT 1;

    IF v_order_id IS NOT NULL THEN
        -- Insert mock return request 1 (pending)
        INSERT INTO public.returns (
            return_number,
            order_id,
            user_id,
            customer_name,
            customer_email,
            reason,
            reason_details,
            status,
            refund_amount,
            created_at
        ) VALUES (
            public.generate_return_number(),
            v_order_id,
            v_user_id,
            'John Doe',
            'john@example.com',
            'defective'::public.return_reason,
            'Product arrived with manufacturing defect on the sleeve',
            'pending'::public.return_status,
            1299.00,
            CURRENT_TIMESTAMP - INTERVAL '2 days'
        ) RETURNING id INTO v_return_id;

        -- Get order item for return items
        SELECT id INTO v_order_item_id
        FROM public.order_items
        WHERE order_id = v_order_id
        LIMIT 1;

        IF v_order_item_id IS NOT NULL THEN
            INSERT INTO public.return_items (
                return_id,
                order_item_id,
                product_name,
                product_image,
                quantity,
                refund_amount
            ) VALUES (
                v_return_id,
                v_order_item_id,
                'Premium Cotton T-Shirt',
                '/assets/images/no_image.png',
                1,
                1299.00
            );
        END IF;

        -- Insert mock return request 2 (approved)
        INSERT INTO public.returns (
            return_number,
            order_id,
            user_id,
            customer_name,
            customer_email,
            reason,
            reason_details,
            status,
            refund_amount,
            created_at
        ) VALUES (
            public.generate_return_number(),
            v_order_id,
            v_user_id,
            'Jane Smith',
            'jane@example.com',
            'size_issue'::public.return_reason,
            'Size L is too large, need size M instead',
            'approved'::public.return_status,
            899.00,
            CURRENT_TIMESTAMP - INTERVAL '5 days'
        );

        -- Insert mock return request 3 (refunded)
        INSERT INTO public.returns (
            return_number,
            order_id,
            user_id,
            customer_name,
            customer_email,
            reason,
            reason_details,
            status,
            refund_amount,
            refund_processed_at,
            created_at
        ) VALUES (
            public.generate_return_number(),
            v_order_id,
            v_user_id,
            'Mike Johnson',
            'mike@example.com',
            'not_as_described'::public.return_reason,
            'Color does not match the product image',
            'refunded'::public.return_status,
            1599.00,
            CURRENT_TIMESTAMP - INTERVAL '1 day',
            CURRENT_TIMESTAMP - INTERVAL '7 days'
        );
    END IF;
END $$;