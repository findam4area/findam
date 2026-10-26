-- Migration: Skill Swap Infrastructure
-- Description: Creates tables for skill exchange and service offerings
-- Requirements: Skill Swap unique feature

-- =====================================================
-- SKILL OFFERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS skill_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Offer details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  -- Categories: graphic_design, tutoring, photography, tech_support, 
  -- writing, translation, video_editing, music, consulting, other
  
  skill_tags TEXT[] DEFAULT '{}',
  -- Array of skill tags for better matching
  
  -- Exchange preferences
  open_to_exchange BOOLEAN DEFAULT TRUE,
  hourly_rate DECIMAL(10, 2),
  -- Hourly rate in Naira (optional if open to exchange)
  
  exchange_preferences JSONB DEFAULT '{}',
  -- JSON object with preferences like:
  -- {"preferred_skills": ["web_development", "design"], "max_hours": 10}
  
  -- Portfolio
  portfolio_items JSONB DEFAULT '[]',
  -- Array of portfolio items: [{"title": "...", "url": "...", "description": "..."}]
  
  -- Availability
  availability JSONB DEFAULT '{}',
  -- JSON object with availability schedule
  -- {"days": ["monday", "wednesday"], "hours": "9am-5pm"}
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  exchange_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  -- active, paused, completed, cancelled
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT skill_offers_hourly_rate_check CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
  CONSTRAINT skill_offers_rating_check CHECK (rating >= 0 AND rating <= 5)
);

-- Create indexes for performance
CREATE INDEX idx_skill_offers_user_id ON skill_offers(user_id);
CREATE INDEX idx_skill_offers_category ON skill_offers(category);
CREATE INDEX idx_skill_offers_status ON skill_offers(status);
CREATE INDEX idx_skill_offers_created_at ON skill_offers(created_at DESC);
CREATE INDEX idx_skill_offers_rating ON skill_offers(rating DESC);
CREATE INDEX idx_skill_offers_skill_tags ON skill_offers USING GIN(skill_tags);

-- =====================================================
-- SKILL EXCHANGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS skill_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parties involved
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Linked offers
  requester_offer_id UUID REFERENCES skill_offers(id) ON DELETE SET NULL,
  provider_offer_id UUID REFERENCES skill_offers(id) ON DELETE SET NULL,
  
  -- Exchange details
  requester_skill VARCHAR(200) NOT NULL,
  provider_skill VARCHAR(200) NOT NULL,
  
  description TEXT,
  -- Description of what needs to be done
  
  -- Hours tracking
  agreed_hours_requester DECIMAL(5, 2) NOT NULL,
  agreed_hours_provider DECIMAL(5, 2) NOT NULL,
  completed_hours_requester DECIMAL(5, 2) DEFAULT 0,
  completed_hours_provider DECIMAL(5, 2) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'proposed',
  -- proposed, accepted, in_progress, completed, cancelled, disputed
  
  -- Dates
  proposed_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Completion tracking
  requester_completed BOOLEAN DEFAULT FALSE,
  provider_completed BOOLEAN DEFAULT FALSE,
  
  -- Reviews
  requester_rating DECIMAL(3, 2),
  provider_rating DECIMAL(3, 2),
  requester_review TEXT,
  provider_review TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT skill_exchanges_different_users CHECK (requester_id != provider_id),
  CONSTRAINT skill_exchanges_hours_check CHECK (
    agreed_hours_requester >= 0 AND 
    agreed_hours_provider >= 0 AND
    completed_hours_requester >= 0 AND
    completed_hours_provider >= 0
  ),
  CONSTRAINT skill_exchanges_rating_check CHECK (
    (requester_rating IS NULL OR (requester_rating >= 0 AND requester_rating <= 5)) AND
    (provider_rating IS NULL OR (provider_rating >= 0 AND provider_rating <= 5))
  )
);

-- Create indexes for performance
CREATE INDEX idx_skill_exchanges_requester_id ON skill_exchanges(requester_id);
CREATE INDEX idx_skill_exchanges_provider_id ON skill_exchanges(provider_id);
CREATE INDEX idx_skill_exchanges_status ON skill_exchanges(status);
CREATE INDEX idx_skill_exchanges_created_at ON skill_exchanges(created_at DESC);
CREATE INDEX idx_skill_exchanges_requester_offer ON skill_exchanges(requester_offer_id);
CREATE INDEX idx_skill_exchanges_provider_offer ON skill_exchanges(provider_offer_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Skill Offers Policies
ALTER TABLE skill_offers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active skill offers
CREATE POLICY "Anyone can view active skill offers"
  ON skill_offers
  FOR SELECT
  USING (status = 'active');

-- Users can view their own skill offers regardless of status
CREATE POLICY "Users can view own skill offers"
  ON skill_offers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own skill offers
CREATE POLICY "Users can create own skill offers"
  ON skill_offers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own skill offers
CREATE POLICY "Users can update own skill offers"
  ON skill_offers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own skill offers
CREATE POLICY "Users can delete own skill offers"
  ON skill_offers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Skill Exchanges Policies
ALTER TABLE skill_exchanges ENABLE ROW LEVEL SECURITY;

-- Users can view exchanges they're involved in
CREATE POLICY "Users can view own exchanges"
  ON skill_exchanges
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = provider_id);

-- Users can create exchange proposals
CREATE POLICY "Users can create exchange proposals"
  ON skill_exchanges
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update exchanges they're involved in
CREATE POLICY "Users can update own exchanges"
  ON skill_exchanges
  FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = provider_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = provider_id);

-- Service role can manage all records
CREATE POLICY "Service role can manage all skill offers"
  ON skill_offers
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage all skill exchanges"
  ON skill_exchanges
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp for skill_offers
CREATE TRIGGER update_skill_offers_updated_at
  BEFORE UPDATE ON skill_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for skill_exchanges
CREATE TRIGGER update_skill_exchanges_updated_at
  BEFORE UPDATE ON skill_exchanges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Increment views count when skill offer is viewed
CREATE OR REPLACE FUNCTION increment_skill_offer_views()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called from application code when a user views an offer
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update exchange count when exchange is completed
CREATE OR REPLACE FUNCTION update_exchange_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update requester's offer
    IF NEW.requester_offer_id IS NOT NULL THEN
      UPDATE skill_offers
      SET exchange_count = exchange_count + 1
      WHERE id = NEW.requester_offer_id;
    END IF;
    
    -- Update provider's offer
    IF NEW.provider_offer_id IS NOT NULL THEN
      UPDATE skill_offers
      SET exchange_count = exchange_count + 1
      WHERE id = NEW.provider_offer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exchange_count_trigger
  AFTER UPDATE ON skill_exchanges
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_exchange_count();

-- Update ratings when reviews are submitted
CREATE OR REPLACE FUNCTION update_skill_offer_ratings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.requester_rating IS NOT NULL AND OLD.requester_rating IS NULL THEN
    -- Update provider's offer rating
    IF NEW.provider_offer_id IS NOT NULL THEN
      UPDATE skill_offers
      SET 
        rating = (rating * review_count + NEW.requester_rating) / (review_count + 1),
        review_count = review_count + 1
      WHERE id = NEW.provider_offer_id;
    END IF;
  END IF;
  
  IF NEW.provider_rating IS NOT NULL AND OLD.provider_rating IS NULL THEN
    -- Update requester's offer rating
    IF NEW.requester_offer_id IS NOT NULL THEN
      UPDATE skill_offers
      SET 
        rating = (rating * review_count + NEW.provider_rating) / (review_count + 1),
        review_count = review_count + 1
      WHERE id = NEW.requester_offer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skill_offer_ratings_trigger
  AFTER UPDATE ON skill_exchanges
  FOR EACH ROW
  WHEN (NEW.requester_rating IS NOT NULL OR NEW.provider_rating IS NOT NULL)
  EXECUTE FUNCTION update_skill_offer_ratings();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get matching skill offers
CREATE OR REPLACE FUNCTION get_matching_skill_offers(
  p_user_id UUID,
  p_desired_skills TEXT[]
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  category VARCHAR,
  skill_tags TEXT[],
  rating DECIMAL,
  exchange_count INTEGER,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.id,
    so.title,
    so.category,
    so.skill_tags,
    so.rating,
    so.exchange_count,
    -- Calculate match score based on tag overlap
    (
      SELECT COUNT(*)
      FROM unnest(so.skill_tags) AS tag
      WHERE tag = ANY(p_desired_skills)
    )::INTEGER AS match_score
  FROM skill_offers so
  WHERE 
    so.user_id != p_user_id
    AND so.status = 'active'
    AND so.open_to_exchange = TRUE
    AND EXISTS (
      SELECT 1
      FROM unnest(so.skill_tags) AS tag
      WHERE tag = ANY(p_desired_skills)
    )
  ORDER BY match_score DESC, so.rating DESC, so.exchange_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept exchange proposal
CREATE OR REPLACE FUNCTION accept_skill_exchange(
  p_exchange_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_provider_id UUID;
BEGIN
  -- Get provider ID
  SELECT provider_id INTO v_provider_id
  FROM skill_exchanges
  WHERE id = p_exchange_id;
  
  -- Check if user is the provider
  IF v_provider_id != p_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Update exchange status
  UPDATE skill_exchanges
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_exchange_id AND status = 'proposed';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark exchange as started
CREATE OR REPLACE FUNCTION start_skill_exchange(
  p_exchange_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE skill_exchanges
  SET 
    status = 'in_progress',
    started_at = NOW(),
    updated_at = NOW()
  WHERE 
    id = p_exchange_id 
    AND status = 'accepted'
    AND (requester_id = p_user_id OR provider_id = p_user_id);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete exchange (both parties must confirm)
CREATE OR REPLACE FUNCTION complete_skill_exchange(
  p_exchange_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_requester_id UUID;
  v_provider_id UUID;
  v_requester_completed BOOLEAN;
  v_provider_completed BOOLEAN;
BEGIN
  -- Get exchange details
  SELECT 
    requester_id, 
    provider_id,
    requester_completed,
    provider_completed
  INTO 
    v_requester_id, 
    v_provider_id,
    v_requester_completed,
    v_provider_completed
  FROM skill_exchanges
  WHERE id = p_exchange_id;
  
  -- Mark completion for the user
  IF p_user_id = v_requester_id THEN
    UPDATE skill_exchanges
    SET requester_completed = TRUE, updated_at = NOW()
    WHERE id = p_exchange_id;
    v_requester_completed := TRUE;
  ELSIF p_user_id = v_provider_id THEN
    UPDATE skill_exchanges
    SET provider_completed = TRUE, updated_at = NOW()
    WHERE id = p_exchange_id;
    v_provider_completed := TRUE;
  ELSE
    RETURN FALSE;
  END IF;
  
  -- If both parties confirmed, mark as completed
  IF v_requester_completed AND v_provider_completed THEN
    UPDATE skill_exchanges
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_exchange_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE skill_offers IS 'Stores skill and service offerings for exchange or hire';
COMMENT ON TABLE skill_exchanges IS 'Tracks skill exchange agreements between users';
COMMENT ON COLUMN skill_offers.skill_tags IS 'Array of skill tags for matching and filtering';
COMMENT ON COLUMN skill_offers.exchange_preferences IS 'JSON object with exchange preferences and requirements';
COMMENT ON COLUMN skill_offers.portfolio_items IS 'Array of portfolio items showcasing work';
COMMENT ON COLUMN skill_exchanges.agreed_hours_requester IS 'Hours the requester agrees to provide';
COMMENT ON COLUMN skill_exchanges.agreed_hours_provider IS 'Hours the provider agrees to provide';
COMMENT ON COLUMN skill_exchanges.completed_hours_requester IS 'Hours completed by requester';
COMMENT ON COLUMN skill_exchanges.completed_hours_provider IS 'Hours completed by provider';
