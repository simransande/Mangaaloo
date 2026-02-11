-- Fix Supabase Storage RLS for Product Images
-- Run this in Supabase SQL Editor

-- 1. Create the products bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 3. Allow anyone to read product images (public access)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- 4. Allow authenticated users (admins) to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- 5. Allow authenticated users to update images
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- 6. Allow authenticated users to delete images
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
