-- Migration: Barter System Infrastructure
-- Requirements: 12 (Barter and Exchange System)

-- ============================================================================
-- BARTER_PROPOSALS TABLE
-- ============================================================================
-- Stores barter/exchange proposals between users
-- Tracks proposal status, value differences, and cash adjustments for partial exchanges
CREATE TABLE barter_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Listing references
  target_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  offered_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  
  -- User references
  proposer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Proposal details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'completed')),
  -- pending: initial proposal awaiting response
  -- accepted: receiver accepted the proposal
  -- rejected: receiver rejected the proposal
  -- countered: receiver made a counter-proposal
  -- expired: proposal expired after timeout
  -- completed: exchange successfully completed
  
  -- Value calculation
  target_listing_value DECIMAL(10, 2) NOT NULL CHECK (target_listing_value >= 0),
  offered_listing_value DECIMAL(10, 2) NOT NULL CHECK (offered_listing_value >= 0),
  value_difference DECIMAL(10, 2) NOT NULL DEFAULT 0,
  -- Positive: proposer's item is worth more
  -- Negative: receiver's item is worth more
  
  -- Cash adjustment for partial exchanges
  cash_adjustment DECIMAL(10, 2) DEFAULT 0 CHECK (cash_adjustment >= 0),
  cash_adjustment_payer TEXT CHECK (cash_adjustment_payer IN ('proposer', 'receiver')),
  -- Who pays the cash difference in partial exchange
  
  -- Proposal message
  message TEXT,
  
  -- Counter-proposal tracking
  counter_proposal_id UUID REFERENCES barter_proposals(id),
  -- Links to the counter-proposal if this proposal was countered
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  -- Proposals expire after 7 days if not responded to
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_listings CHECK (target_listing_id != offered_listing_id),
  CONSTRAINT different_users CHECK (proposer_id != receiver_id)
);

-- Indexes for barter_proposals (Task 39.1)
CREATE INDEX idx_barter_proposals_target_listing ON barter_proposals(target_listing_id);
CREATE INDEX idx_barter_proposals_offered_listing ON barter_proposals(offered_listing_id);
CREATE INDEX idx_barter_proposals_proposer ON barter_proposals(proposer_id);
CREATE INDEX idx_barter_proposals_receiver ON barter_proposals(receiver_id);
CREATE INDEX idx_barter_proposals_status ON barter_proposals(status);
CREATE INDEX idx_barter_proposals_expires_at ON barter_proposals(expires_at);
CREATE INDEX idx_barter_proposals_pending ON barter_proposals(receiver_id, status) 
  WHERE status = 'pending';
CREATE INDEX idx_barter_proposals_active ON barter_proposals(status, expires_at) 
  WHERE status IN ('pending', 'countered');
CREATE INDEX idx_barter_proposals_created ON barter_proposals(created_at DESC);

-- ============================================================================
-- BARTER_PREFERENCES TABLE (Task 39.2)
-- ============================================================================
-- Stores user preferences for barter/exchange
-- Tracks which listings are open to exchange and preferred exchange criteria
CREATE TABLE barter_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Listing reference
  listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Exchange availability
  open_to_exchange BOOLEAN NOT NULL DEFAULT FALSE,
  -- Whether this listing is available for barter/exchange
  
  -- Preferred exchange categories
  preferred_categories TEXT[] DEFAULT '{}',
  -- Array of category IDs the user is interested in exchanging for
  -- Example: ['electronics', 'fashion', 'home-appliances']
  
  -- Value range preferences
  min_value DECIMAL(10, 2) CHECK (min_value >= 0),
  max_value DECIMAL(10, 2) CHECK (max_value >= 0),
  -- Preferred value range for exchange items
  
  -- Exchange notes
  exchange_notes TEXT,
  -- Additional notes about what the user is looking for in exchange
  
  -- Partial exchange preference
  accept_partial_exchange BOOLEAN DEFAULT TRUE,
  -- Whether user accepts exchanges with cash adjustment
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_value_range CHECK (
    (min_value IS NULL AND max_value IS NULL) OR
    (min_value IS NOT NULL AND max_value IS NOT NULL AND min_value <= max_value)
  )
);

-- Indexes for barter_preferences (Task 39.2)
CREATE UNIQUE INDEX idx_barter_preferences_listing ON barter_preferences(listing_id);
CREATE INDEX idx_barter_preferences_user ON barter_preferences(user_id);
CREATE INDEX idx_barter_preferences_open_to_exchange ON barter_preferences(open_to_exchange) 
  WHERE open_to_exchange = TRUE;
CREATE INDEX idx_barter_preferences_categories ON barter_preferences USING GIN(preferred_categories);
CREATE INDEX idx_barter_preferences_value_range ON barter_preferences(min_value, max_value) 
  WHERE min_value IS NOT NULL AND max_value IS NOT NULL;
CREATE INDEX idx_barter_preferences_created ON barter_preferences(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Update barter_proposals.updated_at
CREATE OR REPLACE FUNCTION update_barter_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_barter_proposals_updated_at
  BEFORE UPDATE ON barter_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_barter_proposals_updated_at();

-- Update barter_preferences.updated_at
CREATE OR REPLACE FUNCTION update_barter_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_barter_preferences_updated_at
  BEFORE UPDATE ON barter_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_barter_preferences_updated_at();

-- ============================================================================
-- AUTOMATIC PROPOSAL EXPIRATION
-- ============================================================================

-- Function to automatically expire proposals
CREATE OR REPLACE FUNCTION expire_barter_proposals()
RETURNS void AS $$
BEGIN
  UPDATE barter_proposals
  SET status = 'expired'
  WHERE status IN ('pending', 'countered')
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BARTER PROPOSAL MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to calculate value difference
CREATE OR REPLACE FUNCTION calculate_value_difference(
  p_target_value DECIMAL(10, 2),
  p_offered_value DECIMAL(10, 2)
)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN p_offered_value - p_target_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create a barter proposal
CREATE OR REPLACE FUNCTION create_barter_proposal(
  p_target_listing_id UUID,
  p_offered_listing_id UUID,
  p_proposer_id UUID,
  p_message TEXT DEFAULT NULL,
  p_cash_adjustment DECIMAL(10, 2) DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_proposal_id UUID;
  v_receiver_id UUID;
  v_target_value DECIMAL(10, 2);
  v_offered_value DECIMAL(10, 2);
  v_value_diff DECIMAL(10, 2);
  v_cash_payer TEXT;
BEGIN
  -- Get receiver (owner of target listing)
  SELECT user_id, price INTO v_receiver_id, v_target_value
  FROM listings
  WHERE id = p_target_listing_id;
  
  -- Get offered listing value
  SELECT price INTO v_offered_value
  FROM listings
  WHERE id = p_offered_listing_id
    AND user_id = p_proposer_id;
  
  -- Validate listings exist and belong to correct users
  IF v_receiver_id IS NULL OR v_offered_value IS NULL THEN
    RAISE EXCEPTION 'Invalid listing IDs or user does not own offered listing';
  END IF;
  
  -- Prevent self-exchange
  IF v_receiver_id = p_proposer_id THEN
    RAISE EXCEPTION 'Cannot propose exchange with your own listing';
  END IF;
  
  -- Calculate value difference
  v_value_diff := calculate_value_difference(v_target_value, v_offered_value);
  
  -- Determine who pays cash adjustment
  IF p_cash_adjustment > 0 THEN
    IF v_value_diff < 0 THEN
      v_cash_payer := 'proposer';
    ELSE
      v_cash_payer := 'receiver';
    END IF;
  END IF;
  
  -- Create proposal
  INSERT INTO barter_proposals (
    target_listing_id,
    offered_listing_id,
    proposer_id,
    receiver_id,
    target_listing_value,
    offered_listing_value,
    value_difference,
    cash_adjustment,
    cash_adjustment_payer,
    message
  ) VALUES (
    p_target_listing_id,
    p_offered_listing_id,
    p_proposer_id,
    v_receiver_id,
    v_target_value,
    v_offered_value,
    v_value_diff,
    p_cash_adjustment,
    v_cash_payer,
    p_message
  )
  RETURNING id INTO v_proposal_id;
  
  RETURN v_proposal_id;
END;
$$ LANGUAGE plpgsql;

-- Function to accept a barter proposal
CREATE OR REPLACE FUNCTION accept_barter_proposal(
  p_proposal_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_receiver_id UUID;
BEGIN
  -- Verify user is the receiver
  SELECT receiver_id INTO v_receiver_id
  FROM barter_proposals
  WHERE id = p_proposal_id
    AND status = 'pending';
  
  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Proposal not found or not in pending status';
  END IF;
  
  IF v_receiver_id != p_user_id THEN
    RAISE EXCEPTION 'Only the receiver can accept this proposal';
  END IF;
  
  -- Update proposal status
  UPDATE barter_proposals
  SET status = 'accepted'
  WHERE id = p_proposal_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reject a barter proposal
CREATE OR REPLACE FUNCTION reject_barter_proposal(
  p_proposal_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_receiver_id UUID;
BEGIN
  -- Verify user is the receiver
  SELECT receiver_id INTO v_receiver_id
  FROM barter_proposals
  WHERE id = p_proposal_id
    AND status = 'pending';
  
  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Proposal not found or not in pending status';
  END IF;
  
  IF v_receiver_id != p_user_id THEN
    RAISE EXCEPTION 'Only the receiver can reject this proposal';
  END IF;
  
  -- Update proposal status
  UPDATE barter_proposals
  SET status = 'rejected'
  WHERE id = p_proposal_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active barter proposals
CREATE OR REPLACE VIEW active_barter_proposals AS
SELECT 
  bp.id,
  bp.target_listing_id,
  tl.title AS target_listing_title,
  tl.price AS target_listing_price,
  bp.offered_listing_id,
  ol.title AS offered_listing_title,
  ol.price AS offered_listing_price,
  bp.proposer_id,
  pu.username AS proposer_username,
  bp.receiver_id,
  ru.username AS receiver_username,
  bp.status,
  bp.value_difference,
  bp.cash_adjustment,
  bp.cash_adjustment_payer,
  bp.message,
  bp.expires_at,
  bp.created_at,
  EXTRACT(EPOCH FROM (bp.expires_at - NOW())) / 86400 AS days_until_expiry
FROM barter_proposals bp
JOIN listings tl ON bp.target_listing_id = tl.id
JOIN listings ol ON bp.offered_listing_id = ol.id
JOIN users pu ON bp.proposer_id = pu.id
JOIN users ru ON bp.receiver_id = ru.id
WHERE bp.status IN ('pending', 'countered', 'accepted')
  AND bp.expires_at > NOW()
ORDER BY bp.created_at DESC;

-- View for listings open to exchange
CREATE OR REPLACE VIEW exchange_available_listings AS
SELECT 
  l.id AS listing_id,
  l.title,
  l.price,
  l.category_id,
  l.user_id,
  u.username,
  bp.preferred_categories,
  bp.min_value,
  bp.max_value,
  bp.exchange_notes,
  bp.accept_partial_exchange,
  bp.created_at AS preference_created_at
FROM listings l
JOIN barter_preferences bp ON l.id = bp.listing_id
JOIN users u ON l.user_id = u.id
WHERE bp.open_to_exchange = TRUE
  AND l.state = 'active'
ORDER BY bp.created_at DESC;

-- View for user barter statistics
CREATE OR REPLACE VIEW user_barter_stats AS
SELECT 
  u.id AS user_id,
  u.username,
  COUNT(DISTINCT CASE WHEN bp.proposer_id = u.id THEN bp.id END) AS proposals_sent,
  COUNT(DISTINCT CASE WHEN bp.receiver_id = u.id THEN bp.id END) AS proposals_received,
  COUNT(DISTINCT CASE WHEN bp.proposer_id = u.id AND bp.status = 'accepted' THEN bp.id END) AS proposals_accepted,
  COUNT(DISTINCT CASE WHEN bp.receiver_id = u.id AND bp.status = 'accepted' THEN bp.id END) AS proposals_accepted_by_me,
  COUNT(DISTINCT CASE WHEN bp.status = 'completed' AND (bp.proposer_id = u.id OR bp.receiver_id = u.id) THEN bp.id END) AS exchanges_completed,
  COUNT(DISTINCT CASE WHEN bpref.open_to_exchange = TRUE THEN bpref.listing_id END) AS listings_open_to_exchange
FROM users u
LEFT JOIN barter_proposals bp ON u.id = bp.proposer_id OR u.id = bp.receiver_id
LEFT JOIN barter_preferences bpref ON u.id = bpref.user_id
GROUP BY u.id, u.username;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on barter_proposals
ALTER TABLE barter_proposals ENABLE ROW LEVEL SECURITY;

-- Users can view proposals where they are proposer or receiver
CREATE POLICY barter_proposals_user_view ON barter_proposals
  FOR SELECT
  TO authenticated
  USING (proposer_id = auth.uid() OR receiver_id = auth.uid());

-- Users can insert proposals where they are the proposer
CREATE POLICY barter_proposals_user_insert ON barter_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (proposer_id = auth.uid());

-- Users can update proposals where they are proposer or receiver
CREATE POLICY barter_proposals_user_update ON barter_proposals
  FOR UPDATE
  TO authenticated
  USING (proposer_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (proposer_id = auth.uid() OR receiver_id = auth.uid());

-- Service role can view all proposals (for admin operations)
CREATE POLICY barter_proposals_service_all ON barter_proposals
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on barter_preferences
ALTER TABLE barter_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view all barter preferences (public information)
CREATE POLICY barter_preferences_public_view ON barter_preferences
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert preferences for their own listings
CREATE POLICY barter_preferences_user_insert ON barter_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY barter_preferences_user_update ON barter_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY barter_preferences_user_delete ON barter_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can view all preferences (for admin operations)
CREATE POLICY barter_preferences_service_all ON barter_preferences
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE barter_proposals IS 'Barter/exchange proposals between users. Tracks proposal status, value differences, and cash adjustments for partial exchanges';
COMMENT ON TABLE barter_preferences IS 'User preferences for barter/exchange. Tracks which listings are open to exchange and preferred exchange criteria';

COMMENT ON COLUMN barter_proposals.status IS 'Proposal status: pending, accepted, rejected, countered, expired, completed';
COMMENT ON COLUMN barter_proposals.value_difference IS 'Difference in value between offered and target listings. Positive means proposer item is worth more';
COMMENT ON COLUMN barter_proposals.cash_adjustment IS 'Cash amount to balance value difference in partial exchanges';
COMMENT ON COLUMN barter_proposals.cash_adjustment_payer IS 'Who pays the cash difference: proposer or receiver';
COMMENT ON COLUMN barter_proposals.expires_at IS 'Proposal expiration timestamp. Default 7 days from creation';

COMMENT ON COLUMN barter_preferences.open_to_exchange IS 'Whether this listing is available for barter/exchange';
COMMENT ON COLUMN barter_preferences.preferred_categories IS 'Array of category IDs the user is interested in exchanging for';
COMMENT ON COLUMN barter_preferences.min_value IS 'Minimum value for acceptable exchange items';
COMMENT ON COLUMN barter_preferences.max_value IS 'Maximum value for acceptable exchange items';
COMMENT ON COLUMN barter_preferences.accept_partial_exchange IS 'Whether user accepts exchanges with cash adjustment';

