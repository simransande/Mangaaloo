-- Add payment method and shipping cost to orders table
-- Migration: Add COD payment support

-- Add payment_method enum type
DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('cod', 'online');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add payment_method and shipping_cost columns to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method DEFAULT 'cod'::public.payment_method,
  ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0;

-- Update existing orders to have COD as default payment method
UPDATE public.orders 
SET payment_method = 'cod'::public.payment_method 
WHERE payment_method IS NULL;

-- Add index for payment_method
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);