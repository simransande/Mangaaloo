-- Add billing_address column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Update existing orders to have billing_address same as shipping_address
DO $$
BEGIN
    UPDATE public.orders
    SET billing_address = shipping_address
    WHERE billing_address IS NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to update existing orders: %', SQLERRM;
END $$;