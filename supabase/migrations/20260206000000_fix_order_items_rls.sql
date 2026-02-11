-- Fix RLS policy for order_items to allow users to insert items for their own orders

-- Drop existing policies
DROP POLICY IF EXISTS "users_view_own_order_items" ON public.order_items;
DROP POLICY IF EXISTS "users_insert_own_order_items" ON public.order_items;
DROP POLICY IF EXISTS "admin_manage_order_items" ON public.order_items;

-- Allow users to view their own order items
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

-- Allow users to insert order items for their own orders
CREATE POLICY "users_insert_own_order_items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
);

-- Allow admins full access to order items
CREATE POLICY "admin_manage_order_items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
