-- Create function to increment video views
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE video_listings
  SET views_count = views_count + 1,
      updated_at = NOW()
  WHERE id = video_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_video_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_video_views(UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION increment_video_views IS 'Atomically increments the view count for a video listing';
