-- Supabase Storage Setup SQL
-- Run this in Supabase SQL Editor after creating your project

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'nameplates',
    'nameplates',
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'proposals',
    'proposals',
    false,
    10485760, -- 10 MB
    ARRAY['application/pdf']
  ),
  (
    'signed-docs',
    'signed-docs',
    false,
    10485760, -- 10 MB
    ARRAY['application/pdf']
  ),
  (
    'agreements',
    'agreements',
    false,
    10485760, -- 10 MB
    ARRAY['application/pdf']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for nameplates bucket
CREATE POLICY "Users can upload nameplates for their company"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'nameplates'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

CREATE POLICY "Users can read nameplates from their company"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'nameplates'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

CREATE POLICY "Users can delete nameplates from their company"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'nameplates'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

-- Storage Policies for proposals bucket
CREATE POLICY "Users can upload proposals for their company"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proposals'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

CREATE POLICY "Users can read proposals from their company"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'proposals'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

-- Storage Policies for signed-docs bucket
CREATE POLICY "Users can upload signed docs for their company"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signed-docs'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

CREATE POLICY "Users can read signed docs from their company"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed-docs'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

-- Storage Policies for agreements bucket
CREATE POLICY "Users can upload agreements for their company"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agreements'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

CREATE POLICY "Users can read agreements from their company"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreements'
  AND (storage.foldername(name))[1] = (
    SELECT "companyId"::text 
    FROM "User" 
    WHERE id = auth.uid()::text
  )
);

-- Note: Since we're using NextAuth (not Supabase Auth), we'll use service_role key
-- for file operations. The policies above won't work with NextAuth.
-- Instead, we'll use the service_role key in code which bypasses RLS.

-- For NextAuth compatibility, we can either:
-- 1. Disable RLS on storage.objects (not recommended for security)
-- 2. Use service_role key in code (recommended - we'll handle auth in application code)
-- 3. Create a custom function that validates companyId from NextAuth session

-- Option: Create a function to check company access (for future use)
CREATE OR REPLACE FUNCTION check_company_access(file_path text, user_company_id text)
RETURNS boolean AS $$
BEGIN
  -- Extract company ID from file path (format: companyId/filename)
  RETURN (string_to_array(file_path, '/'))[1] = user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For now, we'll use service_role key in code which bypasses RLS
-- This is safe because we validate companyId in our application code
