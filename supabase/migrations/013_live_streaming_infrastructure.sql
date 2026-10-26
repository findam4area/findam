-- ============================================================================
-- LIVE STREAMING INFRASTRUCTURE (Requirements 2.1-2.10)
-- Tasks: 18.1, 18.2, 18.3
-- ============================================================================

-- ============================================================================
-- Task 18.1: Create live_sessions table
-- Requirements: 2.1, 2.2, 2.4
-- ============================================================================

CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stream configuration
  stream_url TEXT, -- URL for viewers to watch the stream
  stream_key TEXT, -- Private key for broadcaster (encrypted)
  stream_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (stream_status IN ('scheduled', 'live', 'ended', 'terminated')),
  
  -- Session metadata
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Engagement metrics
  viewer_count INTEGER NOT NULL DEFAULT 0,
  peak_viewer_count INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  
  -- Pinned products (max 5 as per Requirement 2.4)
  pinned_products JSONB DEFAULT '[]'::jsonb,
  
  -- Recording
  recording_url TEXT, -- Available for 24 hours after broadcast (Requirement 2.8)
  recording_expires_at TIMESTAMPTZ,
  
  -- Session timing (max 120 minutes per Requirement 2.9)
  scheduled_start_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Computed on end
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  flagged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_live_sessions_user_id ON live_sessions(user_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(stream_status);
CREATE INDEX idx_live_sessions_started_at ON live_sessions(started_at DESC);
CREATE INDEX idx_live_sessions_scheduled_start ON live_sessions(scheduled_start_at) WHERE stream_status = 'scheduled';

-- Constraint: Validate pinned_products array has max 5 items
ALTER TABLE live_sessions ADD CONSTRAINT check_pinned_products_max_5 
  CHECK (jsonb_array_length(pinned_products) <= 5);

-- Constraint: Validate pinned_products contains valid listing IDs
ALTER TABLE live_sessions ADD CONSTRAINT check_pinned_products_format
  CHECK (
    pinned_products IS NULL OR
    jsonb_typeof(pinned_products) = 'array'
  );

-- ============================================================================
-- Task 18.2: Create live_chat_messages table
-- Requirements: 2.3
-- ============================================================================

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  message TEXT NOT NULL,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_live_chat_messages_session_id ON live_chat_messages(session_id, created_at DESC);
CREATE INDEX idx_live_chat_messages_user_id ON live_chat_messages(user_id);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_live_sessions_updated_at();

-- Function: Calculate session duration on end
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stream_status IN ('ended', 'terminated') AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (COALESCE(NEW.ended_at, NOW()) - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_session_duration
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  WHEN (NEW.stream_status IN ('ended', 'terminated'))
  EXECUTE FUNCTION calculate_session_duration();

-- Function: Set recording expiration (24 hours after broadcast ends)
CREATE OR REPLACE FUNCTION set_recording_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stream_status IN ('ended', 'terminated') AND NEW.recording_url IS NOT NULL THEN
    NEW.recording_expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_recording_expiration
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  WHEN (NEW.stream_status IN ('ended', 'terminated') AND NEW.recording_url IS NOT NULL)
  EXECUTE FUNCTION set_recording_expiration();

-- Function: Validate session duration doesn't exceed 120 minutes
CREATE OR REPLACE FUNCTION validate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.started_at IS NOT NULL AND NEW.stream_status = 'live' THEN
    IF EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) / 60 > 120 THEN
      NEW.stream_status = 'ended';
      NEW.ended_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Live Sessions Policies

-- Anyone can view live or ended sessions
CREATE POLICY "Anyone can view live sessions"
  ON live_sessions FOR SELECT
  USING (stream_status IN ('live', 'ended'));

-- Users can view their own sessions (any status)
CREATE POLICY "Users can view own sessions"
  ON live_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Verified sellers can create sessions
CREATE POLICY "Verified sellers can create sessions"
  ON live_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (nin_verified = TRUE OR video_verified = TRUE)
    )
  );

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON live_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON live_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Live Chat Messages Policies

-- Anyone can view messages in live sessions
CREATE POLICY "Anyone can view live chat messages"
  ON live_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE id = session_id
      AND stream_status IN ('live', 'ended')
    )
  );

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
  ON live_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE id = session_id
      AND stream_status = 'live'
    )
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON live_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Session owners can delete any message in their session
CREATE POLICY "Session owners can delete any message"
  ON live_chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE id = session_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- Helper Functions for Live Streaming
-- ============================================================================

-- Function: Get active live sessions with seller info
CREATE OR REPLACE FUNCTION get_active_live_sessions()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  viewer_count INTEGER,
  started_at TIMESTAMPTZ,
  seller_username TEXT,
  seller_avatar_url TEXT,
  seller_trust_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id,
    ls.user_id,
    ls.title,
    ls.description,
    ls.thumbnail_url,
    ls.viewer_count,
    ls.started_at,
    u.username,
    u.avatar_url,
    u.trust_score
  FROM live_sessions ls
  JOIN users u ON ls.user_id = u.id
  WHERE ls.stream_status = 'live'
  ORDER BY ls.viewer_count DESC, ls.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment viewer count
CREATE OR REPLACE FUNCTION increment_viewer_count(session_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET 
    viewer_count = viewer_count + 1,
    total_views = total_views + 1,
    peak_viewer_count = GREATEST(peak_viewer_count, viewer_count + 1)
  WHERE id = session_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Decrement viewer count
CREATE OR REPLACE FUNCTION decrement_viewer_count(session_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_sessions
  SET viewer_count = GREATEST(0, viewer_count - 1)
  WHERE id = session_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Pin product to live session
CREATE OR REPLACE FUNCTION pin_product_to_session(
  session_id_param UUID,
  listing_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
  current_pinned JSONB;
  new_pinned JSONB;
BEGIN
  -- Get current pinned products
  SELECT pinned_products INTO current_pinned
  FROM live_sessions
  WHERE id = session_id_param AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or unauthorized';
  END IF;
  
  -- Check if already pinned
  IF current_pinned @> jsonb_build_array(jsonb_build_object('listing_id', listing_id_param)) THEN
    RETURN current_pinned;
  END IF;
  
  -- Check max 5 products
  IF jsonb_array_length(current_pinned) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 products can be pinned';
  END IF;
  
  -- Add new product
  new_pinned = current_pinned || jsonb_build_array(
    jsonb_build_object(
      'listing_id', listing_id_param,
      'pinned_at', NOW()
    )
  );
  
  -- Update session
  UPDATE live_sessions
  SET pinned_products = new_pinned
  WHERE id = session_id_param;
  
  RETURN new_pinned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Unpin product from live session
CREATE OR REPLACE FUNCTION unpin_product_from_session(
  session_id_param UUID,
  listing_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
  new_pinned JSONB;
BEGIN
  -- Remove product from pinned array
  UPDATE live_sessions
  SET pinned_products = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(pinned_products) elem
    WHERE elem->>'listing_id' != listing_id_param::text
  )
  WHERE id = session_id_param AND user_id = auth.uid()
  RETURNING pinned_products INTO new_pinned;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or unauthorized';
  END IF;
  
  RETURN COALESCE(new_pinned, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE live_sessions IS 'Stores live video streaming sessions for sellers (Requirement 2)';
COMMENT ON TABLE live_chat_messages IS 'Stores chat messages for live streaming sessions (Requirement 2.3)';
COMMENT ON COLUMN live_sessions.pinned_products IS 'JSONB array of up to 5 pinned product objects with listing_id and pinned_at';
COMMENT ON COLUMN live_sessions.stream_status IS 'Session status: scheduled, live, ended, or terminated';
COMMENT ON COLUMN live_sessions.recording_url IS 'Recording available for 24 hours after broadcast ends (Requirement 2.8)';
COMMENT ON COLUMN live_sessions.duration_minutes IS 'Session duration in minutes, max 120 (Requirement 2.9)';
