-- Migration: Verified Seller Badges System
-- Requirement: 15 (Verified Seller Badges)

-- ============================================================================
-- VERIFICATION_BADGES TABLE (Task 27.1)
-- ============================================================================
-- Stores verification badge information for sellers
-- Tracks badge tier (basic/trusted/power) and verification types completed
-- Stores transaction count and average rating for badge eligibility
CREATE TABLE verification_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Badge tier: basic (phone+NIN+video), trusted (10+ txns, 4.5+ rating), power (50+ txns, 4.8+ rating)
  tier TEXT NOT NULL DEFAULT 'none' CHECK (tier IN ('none', 'basic', 'trusted', 'power')),
  
  -- Verification types completed (tracked from users table but cached here for performance)
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  nin_verified BOOLEAN NOT NULL DEFAULT FALSE,
  video_verified BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Transaction metrics for badge eligibility
  transaction_count INTEGER NOT NULL DEFAULT 0 CHECK (transaction_count >= 0),
  average_rating DECIMAL(3, 2) CHECK (average_rating >= 0 AND average_rating <= 5),
  
  -- Badge lifecycle timestamps
  awarded_at TIMESTAMPTZ, -- When current tier was awarded
  revoked_at TIMESTAMPTZ, -- When badge was revoked (if applicable)
  last_checked_at TIMESTAMPTZ DEFAULT NOW(), -- Last time criteria were checked
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for verification_badges (Task 27.1)
CREATE UNIQUE INDEX idx_verification_badges_user ON verification_badges(user_id);
CREATE INDEX idx_verification_badges_tier ON verification_badges(tier);
CREATE INDEX idx_verification_badges_awarded ON verification_badges(awarded_at DESC) WHERE tier != 'none';
CREATE INDEX idx_verification_badges_last_checked ON verification_badges(last_checked_at);

-- ============================================================================
-- BADGE_HISTORY TABLE
-- ============================================================================
-- Audit trail for badge tier changes
CREATE TABLE badge_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_tier TEXT NOT NULL CHECK (previous_tier IN ('none', 'basic', 'trusted', 'power')),
  new_tier TEXT NOT NULL CHECK (new_tier IN ('none', 'basic', 'trusted', 'power')),
  reason TEXT NOT NULL, -- 'verification_complete', 'criteria_met', 'rating_drop', 'violation', 'manual'
  transaction_count INTEGER,
  average_rating DECIMAL(3, 2),
  changed_by UUID REFERENCES users(id), -- NULL for automatic changes, user_id for manual admin changes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for badge_history
CREATE INDEX idx_badge_history_user ON badge_history(user_id, created_at DESC);
CREATE INDEX idx_badge_history_created ON badge_history(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Update verification_badges.updated_at
CREATE OR REPLACE FUNCTION update_verification_badges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_verification_badges_updated_at
  BEFORE UPDATE ON verification_badges
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_badges_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically create verification badge record for new users
CREATE OR REPLACE FUNCTION create_verification_badge_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO verification_badges (
    user_id,
    phone_verified,
    nin_verified,
    video_verified
  )
  VALUES (
    NEW.id,
    NEW.phone_verified,
    NEW.nin_verified,
    NEW.video_verified
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_verification_badge_for_user
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_verification_badge_for_user();

-- Function to sync verification status from users table to verification_badges
CREATE OR REPLACE FUNCTION sync_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update verification_badges when users table verification fields change
  IF (OLD.phone_verified != NEW.phone_verified OR 
      OLD.nin_verified != NEW.nin_verified OR 
      OLD.video_verified != NEW.video_verified) THEN
    
    UPDATE verification_badges
    SET 
      phone_verified = NEW.phone_verified,
      nin_verified = NEW.nin_verified,
      video_verified = NEW.video_verified,
      last_checked_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_verification_status
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_verification_status();

-- Function to calculate seller statistics (transaction count and average rating)
-- This will be called by the VerificationService to update badge eligibility
CREATE OR REPLACE FUNCTION calculate_seller_stats(seller_user_id UUID)
RETURNS TABLE(
  transaction_count INTEGER,
  average_rating DECIMAL(3, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT et.id)::INTEGER as transaction_count,
    ROUND(AVG(r.rating), 2)::DECIMAL(3, 2) as average_rating
  FROM users u
  LEFT JOIN escrow_transactions et ON et.seller_id = u.id AND et.status = 'released'
  LEFT JOIN reviews r ON r.reviewed_user_id = u.id
  WHERE u.id = seller_user_id
  GROUP BY u.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE verification_badges IS 'Stores verification badge tiers for sellers based on verification and performance';
COMMENT ON TABLE badge_history IS 'Audit trail of all badge tier changes with reasons';

COMMENT ON COLUMN verification_badges.tier IS 'Badge tier: none, basic (verified), trusted (10+ txns, 4.5+ rating), power (50+ txns, 4.8+ rating)';
COMMENT ON COLUMN verification_badges.transaction_count IS 'Number of successful (released) escrow transactions as seller';
COMMENT ON COLUMN verification_badges.average_rating IS 'Average rating from all reviews received as seller';
COMMENT ON COLUMN verification_badges.awarded_at IS 'Timestamp when current tier was awarded';
COMMENT ON COLUMN verification_badges.revoked_at IS 'Timestamp when badge was revoked (NULL if currently active)';
COMMENT ON COLUMN verification_badges.last_checked_at IS 'Last time badge criteria were checked by background job';

