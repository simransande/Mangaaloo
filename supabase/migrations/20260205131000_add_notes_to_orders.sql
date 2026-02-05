-- Add notes column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add description for the column
COMMENT ON COLUMN public.orders.notes IS 'Customer special instructions or notes for the order';
