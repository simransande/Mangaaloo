-- Mangaaloo E-Commerce Platform Database Schema
-- Migration: Initial schema with auth, products, orders, inventory, discounts, and designs

-- ============================================================================
-- STEP 1: TYPES (ENUMs)
-- ============================================================================

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'customer');

DROP TYPE IF EXISTS public.order_status CASCADE;
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

DROP TYPE IF EXISTS public.stock_status CASCADE;
CREATE TYPE public.stock_status AS ENUM ('in-stock', 'low-stock', 'out-of-stock');

DROP TYPE IF EXISTS public.discount_type CASCADE;
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

-- ============================================================================
-- STEP 2: CORE TABLES
-- ============================================================================

-- User Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'customer'::public.user_role,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    image_alt TEXT NOT NULL,
    colors TEXT[] DEFAULT ARRAY[]::TEXT[],
    sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
    badge TEXT,
    stock_status public.stock_status DEFAULT 'in-stock'::public.stock_status,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Product Images Table (for multiple images per product)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_alt TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Designs/Offers Table
CREATE TABLE IF NOT EXISTS public.designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_alt TEXT NOT NULL,
    link TEXT,
    badge TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Discounts/Coupons Table
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type public.discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2),
    max_discount_amount DECIMAL(10, 2),
    valid_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMPTZ,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    discount_code TEXT,
    status public.order_status DEFAULT 'pending'::public.order_status,
    items_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2),
    quantity INTEGER NOT NULL,
    color TEXT,
    size TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Logs Table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cart Table (persistent cart)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    color TEXT,
    size TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, color, size)
);

-- ============================================================================
-- STEP 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON public.products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_designs_is_active ON public.designs(is_active);
CREATE INDEX IF NOT EXISTS idx_designs_display_order ON public.designs(display_order);

CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_is_active ON public.discounts(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- ============================================================================
-- STEP 4: FUNCTIONS (BEFORE RLS POLICIES)
-- ============================================================================

-- Function: Auto-create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin'
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- ============================================================================
-- STEP 5: ENABLE RLS
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS POLICIES
-- ============================================================================

-- User Profiles Policies
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Categories Policies (Public read, Admin write)
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories"
ON public.categories
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Products Policies (Public read, Admin write)
DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products"
ON public.products
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products"
ON public.products
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Product Images Policies
DROP POLICY IF EXISTS "public_read_product_images" ON public.product_images;
CREATE POLICY "public_read_product_images"
ON public.product_images
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_product_images" ON public.product_images;
CREATE POLICY "admin_manage_product_images"
ON public.product_images
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Designs Policies (Public read active, Admin full access)
DROP POLICY IF EXISTS "public_read_active_designs" ON public.designs;
CREATE POLICY "public_read_active_designs"
ON public.designs
FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_designs" ON public.designs;
CREATE POLICY "admin_manage_designs"
ON public.designs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Discounts Policies (Public read active, Admin full access)
DROP POLICY IF EXISTS "public_read_active_discounts" ON public.discounts;
CREATE POLICY "public_read_active_discounts"
ON public.discounts
FOR SELECT
TO public
USING (is_active = true AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP));

DROP POLICY IF EXISTS "admin_manage_discounts" ON public.discounts;
CREATE POLICY "admin_manage_discounts"
ON public.discounts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Orders Policies (Users see own, Admin sees all)
DROP POLICY IF EXISTS "users_manage_own_orders" ON public.orders;
CREATE POLICY "users_manage_own_orders"
ON public.orders
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_orders" ON public.orders;
CREATE POLICY "admin_manage_all_orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Order Items Policies
DROP POLICY IF EXISTS "users_view_own_order_items" ON public.order_items;
CREATE POLICY "users_view_own_order_items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "admin_manage_order_items" ON public.order_items;
CREATE POLICY "admin_manage_order_items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Inventory Logs Policies (Admin only)
DROP POLICY IF EXISTS "admin_manage_inventory_logs" ON public.inventory_logs;
CREATE POLICY "admin_manage_inventory_logs"
ON public.inventory_logs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Cart Items Policies (Users manage own cart)
DROP POLICY IF EXISTS "users_manage_own_cart" ON public.cart_items;
CREATE POLICY "users_manage_own_cart"
ON public.cart_items
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 7: TRIGGERS
-- ============================================================================

-- Trigger: Auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Triggers: Update updated_at timestamp
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_designs_updated_at ON public.designs;
CREATE TRIGGER update_designs_updated_at
    BEFORE UPDATE ON public.designs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_discounts_updated_at ON public.discounts;
CREATE TRIGGER update_discounts_updated_at
    BEFORE UPDATE ON public.discounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 8: MOCK DATA
-- ============================================================================

DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    customer_uuid UUID := gen_random_uuid();
    
    cat_tshirts UUID := gen_random_uuid();
    cat_shirts UUID := gen_random_uuid();
    cat_jeans UUID := gen_random_uuid();
    cat_dresses UUID := gen_random_uuid();
    cat_accessories UUID := gen_random_uuid();
    
    prod_1 UUID;
    prod_2 UUID;
    prod_3 UUID;
    prod_4 UUID;
    prod_5 UUID;
    prod_6 UUID;
    prod_7 UUID;
    prod_8 UUID;
    prod_9 UUID;
    prod_10 UUID;
    prod_11 UUID;
    prod_12 UUID;
    
    order_1 UUID := gen_random_uuid();
    order_2 UUID := gen_random_uuid();
    order_3 UUID := gen_random_uuid();
    order_4 UUID := gen_random_uuid();
BEGIN
    -- Create auth users (trigger will create user_profiles automatically)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@mangaaloo.com', crypt('Admin@123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Admin User', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (customer_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'customer@example.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'John Doe'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Create categories
    INSERT INTO public.categories (id, name, slug, description) VALUES
        (cat_tshirts, 'T-Shirts', 't-shirts', 'Comfortable and stylish t-shirts'),
        (cat_shirts, 'Shirts', 'shirts', 'Premium casual and formal shirts'),
        (cat_jeans, 'Jeans', 'jeans', 'Durable and fashionable jeans'),
        (cat_dresses, 'Dresses', 'dresses', 'Elegant dresses for all occasions'),
        (cat_accessories, 'Accessories', 'accessories', 'Complete your look with accessories')
    ON CONFLICT (slug) DO NOTHING;

    -- Create products
    INSERT INTO public.products (id, name, description, price, discounted_price, category_id, image_url, image_alt, colors, sizes, badge, stock_status, stock_quantity)
    VALUES
        (gen_random_uuid(), 'Fancy Graphic T-Shirt', 'Fancy white t-shirt with vibrant colorful graphic design on front', 1499, 999, cat_tshirts, 'https://images.unsplash.com/photo-1725698607780-c5b9521613dd', 'Fancy white t-shirt with vibrant colorful graphic design on front', ARRAY['#000000', '#FFFFFF', '#808080'], ARRAY['S', 'M', 'L', 'XL'], 'Sale', 'in-stock'::public.stock_status, 50),
        (gen_random_uuid(), 'Premium Casual Shirt', 'Premium casual shirt with modern design and comfortable fit', 1999, 1499, cat_shirts, 'https://img.rocket.new/generatedImages/rocket_gen_img_1f4fb9305-1764677609109.png', 'Premium casual shirt with modern design and comfortable fit', ARRAY['#1E3A8A', '#FFFFFF', '#000000'], ARRAY['M', 'L', 'XL'], 'New', 'in-stock'::public.stock_status, 30),
        (gen_random_uuid(), 'Stylish Trousers', 'Stylish comfortable trousers perfect for casual and semi-formal wear', 2499, 1899, cat_jeans, 'https://img.rocket.new/generatedImages/rocket_gen_img_1f07f6a9f-1770102017894.png', 'Stylish comfortable trousers perfect for casual and semi-formal wear', ARRAY['#000000', '#808080', '#1E3A8A'], ARRAY['28', '30', '32', '34'], 'Hot', 'in-stock'::public.stock_status, 25),
        (gen_random_uuid(), 'Gym Performance Tee', 'High-performance gym t-shirt with moisture-wicking fabric', 1299, NULL, cat_tshirts, 'https://img.rocket.new/generatedImages/rocket_gen_img_181e7eac0-1764649791120.png', 'High-performance gym t-shirt with moisture-wicking fabric', ARRAY['#000000', '#FF0000', '#808080'], ARRAY['S', 'M', 'L', 'XL'], NULL, 'in-stock'::public.stock_status, 40),
        (gen_random_uuid(), 'Artistic Print T-Shirt', 'Fancy t-shirt with unique artistic print and creative design', 1399, 1099, cat_tshirts, 'https://img.rocket.new/generatedImages/rocket_gen_img_168ad58cf-1770058301705.png', 'Fancy t-shirt with unique artistic print and creative design', ARRAY['#000000', '#FFFFFF', '#FF1493'], ARRAY['S', 'M', 'L', 'XL'], 'Sale', 'in-stock'::public.stock_status, 35),
        (gen_random_uuid(), 'Formal Dress Shirt', 'Elegant formal dress shirt for professional and business occasions', 2199, NULL, cat_shirts, 'https://img.rocket.new/generatedImages/rocket_gen_img_1c74dfa19-1766569812701.png', 'Elegant formal dress shirt for professional and business occasions', ARRAY['#FFFFFF', '#1E3A8A', '#000000'], ARRAY['M', 'L', 'XL'], NULL, 'in-stock'::public.stock_status, 20),
        (gen_random_uuid(), 'Athletic Gym Shorts', 'Comfortable athletic gym shorts for workout and training', 1099, NULL, cat_accessories, 'https://img.rocket.new/generatedImages/rocket_gen_img_1106a600a-1766778352395.png', 'Comfortable athletic gym shorts for workout and training', ARRAY['#000000', '#808080', '#1E3A8A'], ARRAY['S', 'M', 'L', 'XL'], 'New', 'in-stock'::public.stock_status, 45),
        (gen_random_uuid(), 'Designer Fancy Tee', 'Designer fancy t-shirt with bold graphics and premium quality print', 1599, 1299, cat_tshirts, 'https://img.rocket.new/generatedImages/rocket_gen_img_1da5ca6d4-1764820614416.png', 'Designer fancy t-shirt with bold graphics and premium quality print', ARRAY['#000000', '#FFFFFF', '#FF0000'], ARRAY['S', 'M', 'L', 'XL'], 'Hot', 'in-stock'::public.stock_status, 28),
        (gen_random_uuid(), 'Slim Fit Chino Trousers', 'Slim fit chino trousers with modern cut and comfortable fabric', 2299, 1799, cat_jeans, 'https://img.rocket.new/generatedImages/rocket_gen_img_1320e49e7-1766933988961.png', 'Slim fit chino trousers with modern cut and comfortable fabric', ARRAY['#8B4513', '#000000', '#1E3A8A'], ARRAY['28', '30', '32', '34'], 'Sale', 'low-stock'::public.stock_status, 10),
        (gen_random_uuid(), 'Gym Tank Top', 'Breathable gym tank top for intense workout sessions', 899, NULL, cat_tshirts, 'https://images.unsplash.com/photo-1581122585789-433e91436082', 'Breathable gym tank top for intense workout sessions', ARRAY['#000000', '#FFFFFF', '#808080'], ARRAY['S', 'M', 'L', 'XL'], NULL, 'in-stock'::public.stock_status, 55),
        (gen_random_uuid(), 'Retro Print Shirt', 'Retro style shirt with vintage print and classic design', 1899, NULL, cat_shirts, 'https://img.rocket.new/generatedImages/rocket_gen_img_13d0fbcbd-1767012455596.png', 'Retro style shirt with vintage print and classic design', ARRAY['#FF6347', '#1E3A8A', '#FFFFFF'], ARRAY['M', 'L', 'XL'], 'New', 'in-stock'::public.stock_status, 22),
        (gen_random_uuid(), 'Compression Gym Wear', 'Compression gym wear for enhanced performance and muscle support', 1499, 1199, cat_tshirts, 'https://img.rocket.new/generatedImages/rocket_gen_img_13ccfbf5c-1766317983862.png', 'Compression gym wear for enhanced performance and muscle support', ARRAY['#000000', '#FF0000', '#1E3A8A'], ARRAY['S', 'M', 'L', 'XL'], 'Hot', 'in-stock'::public.stock_status, 32)
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO prod_1;

    -- Create designs/offers
    INSERT INTO public.designs (title, description, image_url, image_alt, link, badge, is_active, display_order) VALUES
        ('T-Shirt + Pants Combo', 'Complete outfit deals - Save up to 40%', 'https://img.rocket.new/generatedImages/rocket_gen_img_110268daa-1770102018327.png', 'Stylish combination of printed t-shirt with matching pants outfit', '/product-listing', 'Combo Deal', true, 1),
        ('Shirt Collections', 'Premium shirts for every occasion', 'https://img.rocket.new/generatedImages/rocket_gen_img_16c447891-1770102022771.png', 'Collection of premium casual and formal shirts', '/product-listing', 'New', true, 2),
        ('Girls Fashion', 'Trendy tees and tops for women', 'https://img.rocket.new/generatedImages/rocket_gen_img_172dfbf99-1770102018639.png', 'Fashionable girls clothing collection with trendy t-shirts and tops', '/product-listing', 'Hot', true, 3),
        ('Mix & Match Special', 'Buy 2 Get 1 Free on all items', 'https://img.rocket.new/generatedImages/rocket_gen_img_19b4443b2-1770102020810.png', 'Mix and match special offer on t-shirts, shirts, and pants', '/product-listing', 'Limited', true, 4),
        ('Complete Wardrobe', 'T-shirts, shirts & pants bundles', 'https://img.rocket.new/generatedImages/rocket_gen_img_19e95bb1d-1770102018073.png', 'Complete wardrobe bundle with t-shirts, shirts, and pants combinations', '/product-listing', 'Bundle', true, 5),
        ('Women Exclusive', 'Stylish tops and tees collection', 'https://img.rocket.new/generatedImages/rocket_gen_img_1c32ad3d6-1765192516891.png', 'Exclusive women collection with stylish tops and tees', '/product-listing', 'Sale', true, 6)
    ON CONFLICT (id) DO NOTHING;

    -- Create discounts
    INSERT INTO public.discounts (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, valid_until, usage_limit, is_active) VALUES
        ('WELCOME10', 'Welcome discount for new customers', 'percentage'::public.discount_type, 10, 500, 200, now() + interval '30 days', 100, true),
        ('SAVE20', 'Save 20% on orders above 2000', 'percentage'::public.discount_type, 20, 2000, 500, now() + interval '15 days', 50, true),
        ('FLAT500', 'Flat 500 off on orders above 3000', 'fixed'::public.discount_type, 500, 3000, 500, now() + interval '7 days', 30, true)
    ON CONFLICT (code) DO NOTHING;

    -- Create sample orders
    SELECT id INTO prod_1 FROM public.products LIMIT 1;
    
    IF prod_1 IS NOT NULL THEN
        INSERT INTO public.orders (id, order_number, user_id, customer_name, customer_email, shipping_address, total_amount, discount_amount, final_amount, status, items_count, created_at) VALUES
            (order_1, 'ORD-1234', customer_uuid, 'John Doe', 'customer@example.com', '123 Main St, City, State 12345', 8999, 0, 8999, 'processing'::public.order_status, 2, now() - interval '1 day'),
            (order_2, 'ORD-1235', customer_uuid, 'John Doe', 'customer@example.com', '123 Main St, City, State 12345', 12999, 1300, 11699, 'shipped'::public.order_status, 3, now() - interval '2 days'),
            (order_3, 'ORD-1236', customer_uuid, 'John Doe', 'customer@example.com', '123 Main St, City, State 12345', 5999, 0, 5999, 'delivered'::public.order_status, 1, now() - interval '5 days'),
            (order_4, 'ORD-1237', NULL, 'Guest User', 'guest@example.com', '456 Oak Ave, Town, State 67890', 19999, 0, 19999, 'processing'::public.order_status, 4, now() - interval '3 hours')
        ON CONFLICT (order_number) DO NOTHING;

        -- Create order items
        INSERT INTO public.order_items (order_id, product_id, product_name, product_image, price, discounted_price, quantity, color, size, subtotal) VALUES
            (order_1, prod_1, 'Fancy Graphic T-Shirt', 'https://images.unsplash.com/photo-1725698607780-c5b9521613dd', 1499, 999, 2, 'Black', 'M', 1998),
            (order_2, prod_1, 'Premium Casual Shirt', 'https://img.rocket.new/generatedImages/rocket_gen_img_1f4fb9305-1764677609109.png', 1999, 1499, 1, 'Blue', 'L', 1499),
            (order_3, prod_1, 'Stylish Trousers', 'https://img.rocket.new/generatedImages/rocket_gen_img_1f07f6a9f-1770102017894.png', 2499, 1899, 1, 'Black', '32', 1899)
        ON CONFLICT (id) DO NOTHING;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;