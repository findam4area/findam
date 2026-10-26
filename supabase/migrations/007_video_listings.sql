-- Create video_listings table for video feed feature
CREATE TABLE video_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 15 AND duration_seconds <= 60),
  views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id)
);

-- Create indexes for performance
CREATE INDEX idx_video_listings_listing_id ON video_listings(listing_id);
CREATE INDEX idx_video_listings_views_count ON video_listings(views_count DESC);
CREATE INDEX idx_video_listings_created_at ON video_listings(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE video_listings IS 'Stores video content for listings in the TikTok-style video feed';
COMMENT ON COLUMN video_listings.duration_seconds IS 'Video duration must be between 15 and 60 seconds';
COMMENT ON COLUMN video_listings.views_count IS 'Tracks total views for analytics';
