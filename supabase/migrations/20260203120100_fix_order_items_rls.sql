-- Fix RLS policy for order_items to allow users to insert items for their own orders
-- This migration adds an INSERT policy for authenticated users

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "users_insert_own_order_items" ON public.order_items;

-- Create new policy to allow users to insert order items for their own orders
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
