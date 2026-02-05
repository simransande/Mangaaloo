-- Add Sample Products Migration
-- Adds categories and 8 sample products for testing checkout and COD flow

-- ============================================================================
-- STEP 1: Add Categories (Idempotent)
-- ============================================================================

DO $$
BEGIN
    -- Insert categories with ON CONFLICT for idempotency
    INSERT INTO public.categories (id, name, slug, description, image_url)
    VALUES 
        (gen_random_uuid(), 'T-Shirts', 't-shirts', 'Comfortable and stylish t-shirts for everyday wear', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
        (gen_random_uuid(), 'Shirts', 'shirts', 'Premium quality formal and casual shirts', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400'),
        (gen_random_uuid(), 'Jeans', 'jeans', 'Durable and fashionable denim jeans', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400')
    ON CONFLICT (slug) DO NOTHING;
    
    RAISE NOTICE 'Categories inserted successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Category insertion failed: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 2: Add Sample Products
-- ============================================================================

DO $$
DECLARE
    tshirt_category_id UUID;
    shirt_category_id UUID;
    jeans_category_id UUID;
BEGIN
    -- Get category IDs (with LIMIT 1 for safety)
    SELECT id INTO tshirt_category_id FROM public.categories WHERE slug = 't-shirts' LIMIT 1;
    SELECT id INTO shirt_category_id FROM public.categories WHERE slug = 'shirts' LIMIT 1;
    SELECT id INTO jeans_category_id FROM public.categories WHERE slug = 'jeans' LIMIT 1;
    
    IF tshirt_category_id IS NULL OR shirt_category_id IS NULL OR jeans_category_id IS NULL THEN
        RAISE NOTICE 'Categories not found. Please run category insertion first.';
        RETURN;
    END IF;
    
    -- Insert T-Shirts (3 products)
    INSERT INTO public.products (
        id, name, description, price, discounted_price, category_id, 
        image_url, image_alt, colors, sizes, badge, stock_status, stock_quantity
    ) VALUES 
        (
            gen_random_uuid(),
            'Classic Cotton T-Shirt',
            'Premium 100% cotton t-shirt with comfortable fit. Perfect for casual wear and everyday comfort.',
            599.00,
            499.00,
            tshirt_category_id,
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
            'White classic cotton t-shirt on wooden hanger',
            ARRAY['White', 'Black', 'Navy Blue', 'Grey'],
            ARRAY['S', 'M', 'L', 'XL', 'XXL'],
            'Bestseller',
            'in-stock'::public.stock_status,
            150
        ),
        (
            gen_random_uuid(),
            'Graphic Print T-Shirt',
            'Trendy graphic print t-shirt made from soft cotton blend. Features unique artwork and modern design.',
            799.00,
            649.00,
            tshirt_category_id,
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
            'Black graphic print t-shirt with artistic design',
            ARRAY['Black', 'White', 'Maroon'],
            ARRAY['S', 'M', 'L', 'XL'],
            'New Arrival',
            'in-stock'::public.stock_status,
            85
        ),
        (
            gen_random_uuid(),
            'V-Neck Premium T-Shirt',
            'Elegant v-neck t-shirt crafted from premium fabric. Ideal for smart casual occasions.',
            699.00,
            NULL,
            tshirt_category_id,
            'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
            'Grey v-neck premium t-shirt folded neatly',
            ARRAY['Grey', 'Navy Blue', 'Olive Green'],
            ARRAY['M', 'L', 'XL', 'XXL'],
            NULL,
            'in-stock'::public.stock_status,
            120
        ),
    -- Insert Shirts (3 products)
        (
            gen_random_uuid(),
            'Formal White Shirt',
            'Classic formal white shirt with wrinkle-free fabric. Perfect for office and formal events.',
            1299.00,
            1099.00,
            shirt_category_id,
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
            'Crisp white formal shirt on display',
            ARRAY['White', 'Light Blue'],
            ARRAY['38', '40', '42', '44', '46'],
            'Bestseller',
            'in-stock'::public.stock_status,
            95
        ),
        (
            gen_random_uuid(),
            'Casual Checked Shirt',
            'Comfortable checked shirt in cotton blend. Great for weekend outings and casual wear.',
            999.00,
            849.00,
            shirt_category_id,
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
            'Blue and white checked casual shirt',
            ARRAY['Blue Check', 'Red Check', 'Green Check'],
            ARRAY['38', '40', '42', '44'],
            NULL,
            'in-stock'::public.stock_status,
            70
        ),
        (
            gen_random_uuid(),
            'Slim Fit Denim Shirt',
            'Stylish slim fit denim shirt with modern cut. Versatile piece for smart casual looks.',
            1499.00,
            NULL,
            shirt_category_id,
            'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
            'Light blue denim shirt with slim fit design',
            ARRAY['Light Blue', 'Dark Blue'],
            ARRAY['38', '40', '42', '44', '46'],
            'Trending',
            'low-stock'::public.stock_status,
            25
        ),
    -- Insert Jeans (2 products)
        (
            gen_random_uuid(),
            'Classic Blue Jeans',
            'Timeless classic blue jeans with regular fit. Durable denim fabric that lasts for years.',
            1599.00,
            1399.00,
            jeans_category_id,
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
            'Classic blue denim jeans laid flat',
            ARRAY['Light Blue', 'Medium Blue', 'Dark Blue'],
            ARRAY['28', '30', '32', '34', '36', '38'],
            'Bestseller',
            'in-stock'::public.stock_status,
            110
        ),
        (
            gen_random_uuid(),
            'Black Skinny Jeans',
            'Modern black skinny jeans with stretch fabric. Perfect fit with contemporary style.',
            1799.00,
            1599.00,
            jeans_category_id,
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
            'Black skinny fit jeans with modern design',
            ARRAY['Black', 'Charcoal Grey'],
            ARRAY['28', '30', '32', '34', '36'],
            'New Arrival',
            'in-stock'::public.stock_status,
            65
        )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Sample products inserted successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Product insertion failed: %', SQLERRM;
END $$;