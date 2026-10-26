-- Create storage buckets (skip if they already exist)
-- Marketplace Enhancement: Added 'listings' bucket for 3-5 image galleries per listing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('listings', 'listings', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('listing-media', 'listing-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('story-videos', 'story-videos', true, 20971520, ARRAY['video/mp4']),
  ('portfolio', 'portfolio', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for listings bucket (Marketplace Enhancement)
-- Requirements: 13.3, 13.5, 13.6, 13.15, 15.1, 15.10
-- Path structure: listings/{user_id}/{listing_id}/image-{index}-{timestamp}.webp
DROP POLICY IF EXISTS "Listing images are publicly accessible" ON storage.objects;
CREATE POLICY "Listing images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');

DROP POLICY IF EXISTS "Users can upload to their own listing folder" ON storage.objects;
CREATE POLICY "Users can upload to their own listing folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
CREATE POLICY "Users can delete their own listing images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for listing-media bucket
DROP POLICY IF EXISTS "Listing media is publicly accessible" ON storage.objects;
CREATE POLICY "Listing media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-media');

DROP POLICY IF EXISTS "Authenticated users can upload listing media" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-media' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own listing media" ON storage.objects;
CREATE POLICY "Users can update their own listing media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own listing media" ON storage.objects;
CREATE POLICY "Users can delete their own listing media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for story-videos bucket
DROP POLICY IF EXISTS "Story videos are publicly accessible" ON storage.objects;
CREATE POLICY "Story videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'story-videos');

DROP POLICY IF EXISTS "Users can upload their own story videos" ON storage.objects;
CREATE POLICY "Users can upload their own story videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'story-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own story videos" ON storage.objects;
CREATE POLICY "Users can delete their own story videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'story-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for portfolio bucket
DROP POLICY IF EXISTS "Portfolio items are publicly accessible" ON storage.objects;
CREATE POLICY "Portfolio items are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Users can upload their own portfolio items" ON storage.objects;
CREATE POLICY "Users can upload their own portfolio items"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own portfolio items" ON storage.objects;
CREATE POLICY "Users can update their own portfolio items"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'portfolio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own portfolio items" ON storage.objects;
CREATE POLICY "Users can delete their own portfolio items"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
