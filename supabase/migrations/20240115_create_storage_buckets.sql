-- Migration: Create Supabase storage buckets with RLS policies
-- Implements Requirements: 13.3, 13.5, 13.6, 13.15, 15.1, 15.10
-- Task: 1.6 Create Supabase storage buckets with RLS policies

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Create listings bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listings',
  'listings',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Drop existing storage policies to ensure clean state
DROP POLICY IF EXISTS "listings_select" ON storage.objects;
DROP POLICY IF EXISTS "listings_insert" ON storage.objects;
DROP POLICY IF EXISTS "listings_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

-- Storage RLS Policies for listings bucket

-- Policy: Anyone can read from listings bucket
CREATE POLICY "listings_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');

-- Policy: Authenticated users can upload to their own folder in listings bucket
-- Path structure: listings/{user_id}/{listing_id}/image-{index}-{timestamp}.webp
CREATE POLICY "listings_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listings' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
  );

-- Policy: Users can delete their own files from listings bucket
CREATE POLICY "listings_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listings' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
  );

-- Storage RLS Policies for avatars bucket

-- Policy: Anyone can read from avatars bucket
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload to their own folder in avatars bucket
-- Path structure: avatars/{user_id}/avatar-{timestamp}.webp
CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
  );

-- Policy: Users can update their own avatar files
CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
  );

-- Policy: Users can delete their own avatar files
CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
  );

-- Comments for documentation
COMMENT ON POLICY "listings_select" ON storage.objects IS 
  'Allow public read access to all listing images';
  
COMMENT ON POLICY "listings_insert" ON storage.objects IS 
  'Allow authenticated users to upload images to their own user folder in listings bucket';
  
COMMENT ON POLICY "listings_delete" ON storage.objects IS 
  'Allow users to delete only their own listing images';
  
COMMENT ON POLICY "avatars_select" ON storage.objects IS 
  'Allow public read access to all avatar images';
  
COMMENT ON POLICY "avatars_insert" ON storage.objects IS 
  'Allow authenticated users to upload avatars to their own user folder';
  
COMMENT ON POLICY "avatars_update" ON storage.objects IS 
  'Allow users to update only their own avatar images';
  
COMMENT ON POLICY "avatars_delete" ON storage.objects IS 
  'Allow users to delete only their own avatar images';