-- Create wishlist table for cross-device sync
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wishlist items
CREATE POLICY "Users can view own wishlist" ON public.wishlists
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own wishlist items
CREATE POLICY "Users can insert own wishlist" ON public.wishlists
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wishlist items
CREATE POLICY "Users can delete own wishlist" ON public.wishlists
FOR DELETE USING (auth.uid() = user_id);