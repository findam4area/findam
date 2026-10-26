-- Migration: Monetization Infrastructure
-- Requirements: 14 (Premium Listing Boosts), 16 (Seller Subscription Plans), 17 (Referral and Invite System)
-- Tasks: 33.1, 33.2, 33.3

-- ============================================================================
-- BOOSTS TABLE (Task 33.1)
-- ============================================================================
-- Stores premium listing boost purchases and performance tracking
-- Boost packages: ₦500 (24h), ₦1,000 (72h), ₦2,000 (7 days)
CREATE TABLE boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Package details
  package_type TEXT NOT NULL CHECK (package_type IN ('basic', 'standard', 'premium')),
  -- basic: ₦500/24h, standard: ₦1,000/72h, premium: ₦2,000/7 days
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  
  -- Performance tracking
  views_gained INTEGER NOT NULL DEFAULT 0 CHECK (views_gained >= 0),
  impressions_gained INTEGER NOT NULL DEFAULT 0 CHECK (impressions_gained >= 0),
  messages_received INTEGER NOT NULL DEFAULT 0 CHECK (messages_received >= 0),
  
  -- Payment details
  paystack_reference TEXT NOT NULL UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Notifications
  expiration_notification_sent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for boosts (Task 33.1)
CREATE INDEX idx_boosts_listing ON boosts(listing_id);
CREATE INDEX idx_boosts_user ON boosts(user_id);
CREATE INDEX idx_boosts_status ON boosts(status);
CREATE INDEX idx_boosts_expires_at ON boosts(expires_at);
CREATE INDEX idx_boosts_active ON boosts(listing_id, status, expires_at) WHERE status = 'active';
CREATE INDEX idx_boosts_expiring_soon ON boosts(expires_at, expiration_notification_sent) 
  WHERE status = 'active' AND expiration_notification_sent = FALSE;
CREATE INDEX idx_boosts_created ON boosts(created_at DESC);

-- ============================================================================
-- SUBSCRIPTIONS TABLE (Task 33.2)
-- ============================================================================
-- Stores seller subscription plans and features
-- Plans: Basic (free), Pro (₦2,999/month), Business (₦5,999/month)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Plan details
  plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'business')),
  -- basic: free, pro: ₦2,999/month, business: ₦5,999/month
  price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  
  -- Features tracking
  features JSONB NOT NULL DEFAULT '{}',
  -- Example: {
  --   "unlimited_listings": true,
  --   "advanced_analytics": true,
  --   "priority_support": false,
  --   "custom_domain": false,
  --   "csv_export": true
  -- }
  
  -- Free boosts allocation
  free_boosts_per_month INTEGER NOT NULL DEFAULT 0 CHECK (free_boosts_per_month >= 0),
  -- basic: 0, pro: 2, business: 5
  free_boosts_remaining INTEGER NOT NULL DEFAULT 0 CHECK (free_boosts_remaining >= 0),
  boosts_reset_at TIMESTAMPTZ, -- Next monthly reset date
  
  -- Subscription period
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ, -- 7-day trial for first-time subscribers
  
  -- Paystack integration
  paystack_subscription_code TEXT UNIQUE,
  paystack_customer_code TEXT,
  paystack_email_token TEXT,
  
  -- Billing
  next_billing_date TIMESTAMPTZ,
  last_billing_date TIMESTAMPTZ,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for subscriptions (Task 33.2)
CREATE UNIQUE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_paystack_code ON subscriptions(paystack_subscription_code) WHERE paystack_subscription_code IS NOT NULL;
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_trial_end ON subscriptions(trial_end) WHERE trial_end IS NOT NULL;
CREATE INDEX idx_subscriptions_boosts_reset ON subscriptions(boosts_reset_at) WHERE boosts_reset_at IS NOT NULL;
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE next_billing_date IS NOT NULL;

-- ============================================================================
-- REFERRALS TABLE (Task 33.3)
-- ============================================================================
-- Stores referral relationships and reward tracking
-- Rewards: ₦500 to referrer on signup, ₦500 on first purchase, ₦200 to new user
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Referral code
  referral_code TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signup_rewarded', 'purchase_rewarded', 'completed')),
  -- pending: user signed up but not yet rewarded
  -- signup_rewarded: ₦500 credited to referrer
  -- purchase_rewarded: additional ₦500 credited to referrer on first purchase
  -- completed: all rewards distributed
  
  -- Reward tracking
  signup_reward_amount DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  signup_reward_credited BOOLEAN DEFAULT FALSE,
  signup_reward_credited_at TIMESTAMPTZ,
  
  purchase_reward_amount DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  purchase_reward_credited BOOLEAN DEFAULT FALSE,
  purchase_reward_credited_at TIMESTAMPTZ,
  
  new_user_reward_amount DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
  new_user_reward_credited BOOLEAN DEFAULT FALSE,
  new_user_reward_credited_at TIMESTAMPTZ,
  
  -- First purchase tracking
  first_purchase_id UUID REFERENCES listings(id),
  first_purchase_at TIMESTAMPTZ,
  
  -- Validation
  is_valid BOOLEAN DEFAULT TRUE, -- False if duplicate account detected
  validation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for referrals (Task 33.3)
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE UNIQUE INDEX idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_valid ON referrals(is_valid) WHERE is_valid = TRUE;
CREATE INDEX idx_referrals_pending_signup ON referrals(referrer_id, status) 
  WHERE status = 'pending' AND signup_reward_credited = FALSE;
CREATE INDEX idx_referrals_pending_purchase ON referrals(referred_user_id, status) 
  WHERE status = 'signup_rewarded' AND purchase_reward_credited = FALSE;
CREATE INDEX idx_referrals_created ON referrals(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Update boosts.updated_at
CREATE OR REPLACE FUNCTION update_boosts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_boosts_updated_at
  BEFORE UPDATE ON boosts
  FOR EACH ROW
  EXECUTE FUNCTION update_boosts_updated_at();

-- Update subscriptions.updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Update referrals.updated_at
CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referrals_updated_at();

-- ============================================================================
-- AUTOMATIC BOOST EXPIRATION
-- ============================================================================

-- Function to automatically expire boosts
CREATE OR REPLACE FUNCTION expire_boosts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at <= NOW() AND NEW.status = 'active' THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expire_boosts
  BEFORE UPDATE ON boosts
  FOR EACH ROW
  EXECUTE FUNCTION expire_boosts();

-- ============================================================================
-- SUBSCRIPTION MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (
    user_id,
    plan,
    price,
    status,
    features,
    free_boosts_per_month,
    free_boosts_remaining,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'basic',
    0,
    'active',
    '{"unlimited_listings": false, "advanced_analytics": false, "priority_support": false, "custom_domain": false, "csv_export": false}'::jsonb,
    0,
    0,
    NOW(),
    NOW() + INTERVAL '1 month'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_subscription
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Function to reset monthly free boosts
CREATE OR REPLACE FUNCTION reset_monthly_boosts()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET 
    free_boosts_remaining = free_boosts_per_month,
    boosts_reset_at = NOW() + INTERVAL '1 month'
  WHERE boosts_reset_at <= NOW()
    AND status = 'active'
    AND plan IN ('pro', 'business');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- REFERRAL REWARD FUNCTIONS
-- ============================================================================

-- Function to credit signup reward to referrer
CREATE OR REPLACE FUNCTION credit_signup_reward(p_referral_id UUID)
RETURNS void AS $$
DECLARE
  v_referrer_id UUID;
  v_reward_amount DECIMAL(10, 2);
BEGIN
  -- Get referrer and reward amount
  SELECT referrer_id, signup_reward_amount
  INTO v_referrer_id, v_reward_amount
  FROM referrals
  WHERE id = p_referral_id
    AND signup_reward_credited = FALSE
    AND is_valid = TRUE;
  
  IF v_referrer_id IS NOT NULL THEN
    -- Credit wallet
    UPDATE wallets
    SET available_balance = available_balance + v_reward_amount
    WHERE user_id = v_referrer_id;
    
    -- Update referral record
    UPDATE referrals
    SET 
      signup_reward_credited = TRUE,
      signup_reward_credited_at = NOW(),
      status = 'signup_rewarded'
    WHERE id = p_referral_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to credit purchase reward to referrer
CREATE OR REPLACE FUNCTION credit_purchase_reward(p_referral_id UUID, p_purchase_id UUID)
RETURNS void AS $$
DECLARE
  v_referrer_id UUID;
  v_reward_amount DECIMAL(10, 2);
BEGIN
  -- Get referrer and reward amount
  SELECT referrer_id, purchase_reward_amount
  INTO v_referrer_id, v_reward_amount
  FROM referrals
  WHERE id = p_referral_id
    AND purchase_reward_credited = FALSE
    AND is_valid = TRUE;
  
  IF v_referrer_id IS NOT NULL THEN
    -- Credit wallet
    UPDATE wallets
    SET available_balance = available_balance + v_reward_amount
    WHERE user_id = v_referrer_id;
    
    -- Update referral record
    UPDATE referrals
    SET 
      purchase_reward_credited = TRUE,
      purchase_reward_credited_at = NOW(),
      first_purchase_id = p_purchase_id,
      first_purchase_at = NOW(),
      status = 'completed'
    WHERE id = p_referral_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to credit new user reward
CREATE OR REPLACE FUNCTION credit_new_user_reward(p_referral_id UUID)
RETURNS void AS $$
DECLARE
  v_referred_user_id UUID;
  v_reward_amount DECIMAL(10, 2);
BEGIN
  -- Get referred user and reward amount
  SELECT referred_user_id, new_user_reward_amount
  INTO v_referred_user_id, v_reward_amount
  FROM referrals
  WHERE id = p_referral_id
    AND new_user_reward_credited = FALSE
    AND is_valid = TRUE;
  
  IF v_referred_user_id IS NOT NULL THEN
    -- Credit wallet
    UPDATE wallets
    SET available_balance = available_balance + v_reward_amount
    WHERE user_id = v_referred_user_id;
    
    -- Update referral record
    UPDATE referrals
    SET 
      new_user_reward_credited = TRUE,
      new_user_reward_credited_at = NOW()
    WHERE id = p_referral_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active boosts
CREATE OR REPLACE VIEW active_boosts AS
SELECT 
  b.id,
  b.listing_id,
  b.user_id,
  b.package_type,
  b.price,
  b.started_at,
  b.expires_at,
  b.views_gained,
  b.impressions_gained,
  b.messages_received,
  l.title AS listing_title,
  u.username AS seller_username,
  EXTRACT(EPOCH FROM (b.expires_at - NOW())) / 3600 AS hours_remaining
FROM boosts b
JOIN listings l ON b.listing_id = l.id
JOIN users u ON b.user_id = u.id
WHERE b.status = 'active'
  AND b.expires_at > NOW()
ORDER BY b.expires_at ASC;

-- View for subscription summary
CREATE OR REPLACE VIEW subscription_summary AS
SELECT 
  s.user_id,
  s.plan,
  s.status,
  s.free_boosts_per_month,
  s.free_boosts_remaining,
  s.current_period_end,
  s.trial_end,
  s.cancel_at_period_end,
  u.username,
  u.email,
  CASE 
    WHEN s.trial_end IS NOT NULL AND s.trial_end > NOW() THEN TRUE
    ELSE FALSE
  END AS is_trial_active,
  EXTRACT(EPOCH FROM (s.current_period_end - NOW())) / 86400 AS days_until_renewal
FROM subscriptions s
JOIN users u ON s.user_id = u.id;

-- View for referral statistics
CREATE OR REPLACE VIEW referral_stats AS
SELECT 
  r.referrer_id,
  u.username AS referrer_username,
  COUNT(*) AS total_referrals,
  COUNT(*) FILTER (WHERE r.status = 'completed') AS completed_referrals,
  COUNT(*) FILTER (WHERE r.signup_reward_credited = TRUE) AS signup_rewards_paid,
  COUNT(*) FILTER (WHERE r.purchase_reward_credited = TRUE) AS purchase_rewards_paid,
  SUM(CASE WHEN r.signup_reward_credited THEN r.signup_reward_amount ELSE 0 END) AS total_signup_rewards,
  SUM(CASE WHEN r.purchase_reward_credited THEN r.purchase_reward_amount ELSE 0 END) AS total_purchase_rewards,
  SUM(
    CASE WHEN r.signup_reward_credited THEN r.signup_reward_amount ELSE 0 END +
    CASE WHEN r.purchase_reward_credited THEN r.purchase_reward_amount ELSE 0 END
  ) AS total_rewards_earned
FROM referrals r
JOIN users u ON r.referrer_id = u.id
WHERE r.is_valid = TRUE
GROUP BY r.referrer_id, u.username
ORDER BY total_rewards_earned DESC;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on boosts
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;

-- Users can view their own boosts
CREATE POLICY boosts_user_view ON boosts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own boosts
CREATE POLICY boosts_user_insert ON boosts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Service role can view all boosts (for admin operations)
CREATE POLICY boosts_service_all ON boosts
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY subscriptions_user_view ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own subscription
CREATE POLICY subscriptions_user_update ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can view all subscriptions (for admin operations)
CREATE POLICY subscriptions_service_all ON subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals where they are the referrer
CREATE POLICY referrals_referrer_view ON referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

-- Users can view referrals where they are the referred user
CREATE POLICY referrals_referred_view ON referrals
  FOR SELECT
  TO authenticated
  USING (referred_user_id = auth.uid());

-- Users can insert referrals where they are the referred user
CREATE POLICY referrals_user_insert ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referred_user_id = auth.uid());

-- Service role can view all referrals (for admin operations)
CREATE POLICY referrals_service_all ON referrals
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE boosts IS 'Premium listing boost purchases with performance tracking. Packages: ₦500 (24h), ₦1,000 (72h), ₦2,000 (7 days)';
COMMENT ON TABLE subscriptions IS 'Seller subscription plans. Plans: Basic (free), Pro (₦2,999/month), Business (₦5,999/month)';
COMMENT ON TABLE referrals IS 'Referral relationships and reward tracking. Rewards: ₦500 on signup, ₦500 on first purchase, ₦200 to new user';

COMMENT ON COLUMN boosts.package_type IS 'Boost package: basic (₦500/24h), standard (₦1,000/72h), premium (₦2,000/7 days)';
COMMENT ON COLUMN boosts.expires_at IS 'Boost expiration timestamp. Automatically set based on duration_hours';
COMMENT ON COLUMN boosts.views_gained IS 'Additional views gained during boost period for performance tracking';

COMMENT ON COLUMN subscriptions.plan IS 'Subscription plan: basic (free), pro (₦2,999/month), business (₦5,999/month)';
COMMENT ON COLUMN subscriptions.features IS 'JSON object of enabled features for the subscription plan';
COMMENT ON COLUMN subscriptions.free_boosts_per_month IS 'Number of free boosts allocated per month: basic (0), pro (2), business (5)';
COMMENT ON COLUMN subscriptions.free_boosts_remaining IS 'Remaining free boosts for current month. Resets monthly';
COMMENT ON COLUMN subscriptions.paystack_subscription_code IS 'Paystack subscription code for recurring billing';

COMMENT ON COLUMN referrals.status IS 'Referral status: pending, signup_rewarded (₦500), purchase_rewarded (₦500), completed';
COMMENT ON COLUMN referrals.signup_reward_amount IS 'Reward amount credited to referrer on signup (default ₦500)';
COMMENT ON COLUMN referrals.purchase_reward_amount IS 'Additional reward to referrer on first purchase (default ₦500)';
COMMENT ON COLUMN referrals.new_user_reward_amount IS 'Reward amount credited to new user on signup (default ₦200)';
COMMENT ON COLUMN referrals.is_valid IS 'False if duplicate account detected or referral invalidated';
