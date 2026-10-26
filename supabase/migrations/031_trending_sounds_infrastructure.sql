-- Migration: Trending Sounds Infrastructure
-- Create trending_sounds table
-- Requirements: Trending Sounds

-- Create trending_sounds table
CREATE TABLE IF NOT EXISTS trending_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  usage_count INTEGER DEFAULT 0,
  trending_score DECIMAL(10, 2) DEFAULT 0,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_trending_sounds_trending_score ON trending_sounds(trending_score DESC) WHERE is_active = true;
CREATE INDEX idx_trending_sounds_usage_count ON trending_sounds(usage_count DESC) WHERE is_active = true;
CREATE INDEX idx_trending_sounds_category ON trending_sounds(category) WHERE is_active = true;
CREATE INDEX idx_trending_sounds_uploaded_by ON trending_sounds(uploaded_by);
CREATE INDEX idx_trending_sounds_created_at ON trending_sounds(created_at DESC);

-- Create video_listing_sounds junction table to link sounds to video listings
CREATE TABLE IF NOT EXISTS video_listing_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sound_id UUID NOT NULL REFERENCES trending_sounds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, sound_id)
);

CREATE INDEX idx_video_listing_sounds_listing ON video_listing_sounds(listing_id);
CREATE INDEX idx_video_listing_sounds_sound ON video_listing_sounds(sound_id);

-- Enable RLS
ALTER TABLE trending_sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_listing_sounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trending_sounds
-- Anyone can view active sounds
CREATE POLICY "Anyone can view active trending sounds"
  ON trending_sounds FOR SELECT
  USING (is_active = true);

-- Authenticated users can create sounds
CREATE POLICY "Authenticated users can create trending sounds"
  ON trending_sounds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Users can update their own sounds
CREATE POLICY "Users can update their own trending sounds"
  ON trending_sounds FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Users can delete their own sounds
CREATE POLICY "Users can delete their own trending sounds"
  ON trending_sounds FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- RLS Policies for video_listing_sounds
-- Anyone can view sound associations
CREATE POLICY "Anyone can view video listing sounds"
  ON video_listing_sounds FOR SELECT
  USING (true);

-- Listing owners can add sounds to their listings
CREATE POLICY "Listing owners can add sounds"
  ON video_listing_sounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.user_id = auth.uid()
    )
  );

-- Listing owners can remove sounds from their listings
CREATE POLICY "Listing owners can remove sounds"
  ON video_listing_sounds FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.user_id = auth.uid()
    )
  );

-- Function to update trending score
CREATE OR REPLACE FUNCTION update_trending_score()
RETURNS void AS $$
BEGIN
  -- Calculate trending score based on:
  -- - Recent usage (last 7 days weighted more)
  -- - Total usage count
  -- - Recency of creation
  UPDATE trending_sounds
  SET trending_score = (
    -- Base score from usage count
    (usage_count * 1.0) +
    -- Bonus for recent creation (up to 30 days)
    (CASE 
      WHEN created_at > NOW() - INTERVAL '7 days' THEN 50
      WHEN created_at > NOW() - INTERVAL '14 days' THEN 30
      WHEN created_at > NOW() - INTERVAL '30 days' THEN 10
      ELSE 0
    END)
  )
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage count when sound is used
CREATE OR REPLACE FUNCTION increment_sound_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trending_sounds
  SET 
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = NEW.sound_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment usage count
CREATE TRIGGER trigger_increment_sound_usage
  AFTER INSERT ON video_listing_sounds
  FOR EACH ROW
  EXECUTE FUNCTION increment_sound_usage();

-- Function to get trending sounds
CREATE OR REPLACE FUNCTION get_trending_sounds(
  p_limit INTEGER DEFAULT 20,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  audio_url TEXT,
  duration_seconds INTEGER,
  usage_count INTEGER,
  trending_score DECIMAL,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.title,
    ts.artist,
    ts.audio_url,
    ts.duration_seconds,
    ts.usage_count,
    ts.trending_score,
    ts.category,
    ts.tags,
    ts.created_at
  FROM trending_sounds ts
  WHERE ts.is_active = true
    AND (p_category IS NULL OR ts.category = p_category)
  ORDER BY ts.trending_score DESC, ts.usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp
CREATE TRIGGER update_trending_sounds_updated_at
  BEFORE UPDATE ON trending_sounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE trending_sounds IS 'Stores trending audio clips that can be used in video listings';
COMMENT ON TABLE video_listing_sounds IS 'Junction table linking video listings to trending sounds';
COMMENT ON FUNCTION update_trending_score() IS 'Recalculates trending scores for all active sounds';
COMMENT ON FUNCTION get_trending_sounds(INTEGER, TEXT) IS 'Returns trending sounds ordered by score';
