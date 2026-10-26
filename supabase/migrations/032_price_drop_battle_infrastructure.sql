-- Migration: Price Drop Battle Infrastructure
-- Task 68.1: Create price_drop_battles table
-- Requirements: Price Drop Battle

-- Create price_drop_battles table
CREATE TABLE IF NOT EXISTS price_drop_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pricing
  original_price DECIMAL(10, 2) NOT NULL,
  current_offer DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2),
  
  -- Battle state
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'rejected', 'expired', 'cancelled')),
  current_round INTEGER DEFAULT 1,
  max_rounds INTEGER DEFAULT 5,
  last_offer_by TEXT CHECK (last_offer_by IN ('buyer', 'seller')),
  
  -- Timing
  round_duration_minutes INTEGER DEFAULT 30,
  round_started_at TIMESTAMPTZ,
  round_expires_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_price_range CHECK (current_offer > 0 AND current_offer <= original_price)
);

-- Create battle_offers table to track all offers in a battle
CREATE TABLE IF NOT EXISTS battle_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES price_drop_battles(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  offered_by TEXT NOT NULL CHECK (offered_by IN ('buyer', 'seller')),
  offer_amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_price_drop_battles_listing ON price_drop_battles(listing_id);
CREATE INDEX idx_price_drop_battles_buyer ON price_drop_battles(buyer_id);
CREATE INDEX idx_price_drop_battles_seller ON price_drop_battles(seller_id);
CREATE INDEX idx_price_drop_battles_status ON price_drop_battles(status);
CREATE INDEX idx_price_drop_battles_expires_at ON price_drop_battles(expires_at) WHERE status = 'active';
CREATE INDEX idx_battle_offers_battle ON battle_offers(battle_id);
CREATE INDEX idx_battle_offers_round ON battle_offers(battle_id, round_number);

-- Enable RLS
ALTER TABLE price_drop_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_drop_battles
-- Buyers and sellers can view their own battles
CREATE POLICY "Users can view their own battles"
  ON price_drop_battles FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Buyers can create battles
CREATE POLICY "Buyers can create battles"
  ON price_drop_battles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.user_id = seller_id
      AND listings.is_active = true
    )
  );

-- Participants can update their battles
CREATE POLICY "Participants can update battles"
  ON price_drop_battles FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for battle_offers
-- Participants can view offers in their battles
CREATE POLICY "Participants can view battle offers"
  ON battle_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM price_drop_battles
      WHERE price_drop_battles.id = battle_id
      AND (price_drop_battles.buyer_id = auth.uid() OR price_drop_battles.seller_id = auth.uid())
    )
  );

-- Participants can create offers
CREATE POLICY "Participants can create offers"
  ON battle_offers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM price_drop_battles
      WHERE price_drop_battles.id = battle_id
      AND (price_drop_battles.buyer_id = auth.uid() OR price_drop_battles.seller_id = auth.uid())
      AND price_drop_battles.status = 'active'
    )
  );

-- Participants can update offers
CREATE POLICY "Participants can update offers"
  ON battle_offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_drop_battles
      WHERE price_drop_battles.id = battle_id
      AND (price_drop_battles.buyer_id = auth.uid() OR price_drop_battles.seller_id = auth.uid())
    )
  );

-- Function to start a new price drop battle
CREATE OR REPLACE FUNCTION start_price_drop_battle(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_initial_offer DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_battle_id UUID;
  v_seller_id UUID;
  v_original_price DECIMAL;
BEGIN
  -- Get listing details
  SELECT user_id, price INTO v_seller_id, v_original_price
  FROM listings
  WHERE id = p_listing_id AND is_active = true;
  
  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found or inactive';
  END IF;
  
  IF v_seller_id = p_buyer_id THEN
    RAISE EXCEPTION 'Cannot start battle with your own listing';
  END IF;
  
  IF p_initial_offer >= v_original_price THEN
    RAISE EXCEPTION 'Initial offer must be less than listing price';
  END IF;
  
  -- Check for existing active battle
  IF EXISTS (
    SELECT 1 FROM price_drop_battles
    WHERE listing_id = p_listing_id
    AND buyer_id = p_buyer_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active battle already exists for this listing';
  END IF;
  
  -- Create battle
  INSERT INTO price_drop_battles (
    listing_id,
    buyer_id,
    seller_id,
    original_price,
    current_offer,
    last_offer_by,
    round_started_at,
    round_expires_at
  ) VALUES (
    p_listing_id,
    p_buyer_id,
    v_seller_id,
    v_original_price,
    p_initial_offer,
    'buyer',
    NOW(),
    NOW() + INTERVAL '30 minutes'
  )
  RETURNING id INTO v_battle_id;
  
  -- Create initial offer record
  INSERT INTO battle_offers (
    battle_id,
    round_number,
    offered_by,
    offer_amount
  ) VALUES (
    v_battle_id,
    1,
    'buyer',
    p_initial_offer
  );
  
  RETURN v_battle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make a counter offer
CREATE OR REPLACE FUNCTION make_counter_offer(
  p_battle_id UUID,
  p_user_id UUID,
  p_offer_amount DECIMAL,
  p_message TEXT DEFAULT NULL
)
RETURNS battle_offers AS $$
DECLARE
  v_battle price_drop_battles;
  v_offer_by TEXT;
  v_new_round INTEGER;
  v_result battle_offers;
BEGIN
  -- Get battle details
  SELECT * INTO v_battle
  FROM price_drop_battles
  WHERE id = p_battle_id;
  
  IF v_battle.id IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;
  
  IF v_battle.status != 'active' THEN
    RAISE EXCEPTION 'Battle is not active';
  END IF;
  
  IF v_battle.round_expires_at < NOW() THEN
    RAISE EXCEPTION 'Current round has expired';
  END IF;
  
  -- Determine who is making the offer
  IF p_user_id = v_battle.buyer_id THEN
    v_offer_by := 'buyer';
    IF v_battle.last_offer_by = 'buyer' THEN
      RAISE EXCEPTION 'Waiting for seller response';
    END IF;
  ELSIF p_user_id = v_battle.seller_id THEN
    v_offer_by := 'seller';
    IF v_battle.last_offer_by = 'seller' THEN
      RAISE EXCEPTION 'Waiting for buyer response';
    END IF;
  ELSE
    RAISE EXCEPTION 'User is not a participant in this battle';
  END IF;
  
  -- Validate offer amount
  IF v_offer_by = 'buyer' AND p_offer_amount <= v_battle.current_offer THEN
    RAISE EXCEPTION 'Buyer offer must be higher than current offer';
  END IF;
  
  IF v_offer_by = 'seller' AND p_offer_amount >= v_battle.current_offer THEN
    RAISE EXCEPTION 'Seller counter must be lower than current offer';
  END IF;
  
  IF p_offer_amount > v_battle.original_price OR p_offer_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid offer amount';
  END IF;
  
  -- Increment round if seller is responding
  IF v_offer_by = 'seller' THEN
    v_new_round := v_battle.current_round + 1;
  ELSE
    v_new_round := v_battle.current_round;
  END IF;
  
  -- Check max rounds
  IF v_new_round > v_battle.max_rounds THEN
    UPDATE price_drop_battles
    SET status = 'expired', updated_at = NOW()
    WHERE id = p_battle_id;
    RAISE EXCEPTION 'Maximum rounds reached';
  END IF;
  
  -- Update battle
  UPDATE price_drop_battles
  SET 
    current_offer = p_offer_amount,
    current_round = v_new_round,
    last_offer_by = v_offer_by,
    round_started_at = NOW(),
    round_expires_at = NOW() + (round_duration_minutes || ' minutes')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_battle_id;
  
  -- Create offer record
  INSERT INTO battle_offers (
    battle_id,
    round_number,
    offered_by,
    offer_amount,
    message
  ) VALUES (
    p_battle_id,
    v_new_round,
    v_offer_by,
    p_offer_amount,
    p_message
  )
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept current offer
CREATE OR REPLACE FUNCTION accept_battle_offer(
  p_battle_id UUID,
  p_user_id UUID
)
RETURNS price_drop_battles AS $$
DECLARE
  v_battle price_drop_battles;
  v_result price_drop_battles;
BEGIN
  -- Get battle details
  SELECT * INTO v_battle
  FROM price_drop_battles
  WHERE id = p_battle_id;
  
  IF v_battle.id IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;
  
  IF v_battle.status != 'active' THEN
    RAISE EXCEPTION 'Battle is not active';
  END IF;
  
  -- Verify user can accept (must be the one who didn't make last offer)
  IF (v_battle.last_offer_by = 'buyer' AND p_user_id != v_battle.seller_id) OR
     (v_battle.last_offer_by = 'seller' AND p_user_id != v_battle.buyer_id) THEN
    RAISE EXCEPTION 'Only the recipient can accept the offer';
  END IF;
  
  -- Update battle status
  UPDATE price_drop_battles
  SET 
    status = 'accepted',
    final_price = current_offer,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_battle_id
  RETURNING * INTO v_result;
  
  -- Mark last offer as accepted
  UPDATE battle_offers
  SET status = 'accepted', responded_at = NOW()
  WHERE battle_id = p_battle_id
  AND round_number = v_battle.current_round
  AND offered_by = v_battle.last_offer_by;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject/cancel battle
CREATE OR REPLACE FUNCTION reject_battle(
  p_battle_id UUID,
  p_user_id UUID
)
RETURNS price_drop_battles AS $$
DECLARE
  v_battle price_drop_battles;
  v_result price_drop_battles;
BEGIN
  SELECT * INTO v_battle
  FROM price_drop_battles
  WHERE id = p_battle_id;
  
  IF v_battle.id IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;
  
  IF v_battle.status != 'active' THEN
    RAISE EXCEPTION 'Battle is not active';
  END IF;
  
  IF p_user_id != v_battle.buyer_id AND p_user_id != v_battle.seller_id THEN
    RAISE EXCEPTION 'User is not a participant';
  END IF;
  
  UPDATE price_drop_battles
  SET 
    status = 'rejected',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_battle_id
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old battles (run via cron)
CREATE OR REPLACE FUNCTION expire_old_battles()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Expire battles that have passed their expiration time
  UPDATE price_drop_battles
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
  AND (expires_at < NOW() OR round_expires_at < NOW());
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get battle history for a user
CREATE OR REPLACE FUNCTION get_user_battle_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  battle_id UUID,
  listing_id UUID,
  listing_title TEXT,
  other_user_id UUID,
  role TEXT,
  original_price DECIMAL,
  final_price DECIMAL,
  status TEXT,
  rounds INTEGER,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pdb.id,
    pdb.listing_id,
    l.title,
    CASE 
      WHEN pdb.buyer_id = p_user_id THEN pdb.seller_id
      ELSE pdb.buyer_id
    END,
    CASE 
      WHEN pdb.buyer_id = p_user_id THEN 'buyer'
      ELSE 'seller'
    END,
    pdb.original_price,
    pdb.final_price,
    pdb.status,
    pdb.current_round,
    pdb.created_at,
    pdb.completed_at
  FROM price_drop_battles pdb
  JOIN listings l ON l.id = pdb.listing_id
  WHERE pdb.buyer_id = p_user_id OR pdb.seller_id = p_user_id
  ORDER BY pdb.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp
CREATE TRIGGER update_price_drop_battles_updated_at
  BEFORE UPDATE ON price_drop_battles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE price_drop_battles IS 'Stores gamified price negotiation battles between buyers and sellers';
COMMENT ON TABLE battle_offers IS 'Tracks all offers made during a price drop battle';
COMMENT ON FUNCTION start_price_drop_battle(UUID, UUID, DECIMAL) IS 'Initiates a new price drop battle';
COMMENT ON FUNCTION make_counter_offer(UUID, UUID, DECIMAL, TEXT) IS 'Makes a counter offer in an active battle';
COMMENT ON FUNCTION accept_battle_offer(UUID, UUID) IS 'Accepts the current offer and completes the battle';
COMMENT ON FUNCTION expire_old_battles() IS 'Expires battles that have exceeded their time limits';
