-- Migration: Subscription Management Enhancements
-- Task 20.2: Implement subscription management features
-- Requirements: 24.6, 24.7, 24.8, 24.9

-- ============================================================================
-- PROMO CODES TABLE
-- ============================================================================
-- Stores promotional codes and discount campaigns for subscriptions
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Discount details
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  -- If percentage: value between 1-100 (e.g., 20 = 20% off)
  -- If fixed_amount: value in NGN (e.g., 1000 = ₦1,000 off)
  
  -- Applicable plans
  applicable_plans TEXT[] DEFAULT ARRAY['pro', 'enterprise'], -- Which plans can use this code
  
  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Usage limits
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
  max_uses_per_user INTEGER DEFAULT 1 CHECK (max_uses_per_user >= 1),
  
  -- Duration
  duration_months INTEGER DEFAULT 1 CHECK (duration_months >= 1), -- How many months discount applies
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for promo_codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid ON promo_codes(valid_from, valid_until) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_promo_codes_uses ON promo_codes(current_uses, max_uses);

COMMENT ON TABLE promo_codes IS 'Promotional codes for subscription discounts';
COMMENT ON COLUMN promo_codes.discount_type IS 'Type of discount: percentage (1-100) or fixed_amount (in NGN)';
COMMENT ON COLUMN promo_codes.applicable_plans IS 'Array of plan names this code can be applied to';
COMMENT ON COLUMN promo_codes.max_uses IS 'Maximum total uses of this code across all users. NULL = unlimited';
COMMENT ON COLUMN promo_codes.max_uses_per_user IS 'Maximum uses per individual user (default 1)';
COMMENT ON COLUMN promo_codes.duration_months IS 'Number of months the discount applies (default 1 month)';

-- ============================================================================
-- PROMO CODE REDEMPTIONS TABLE
-- ============================================================================
-- Track which users have used which promo codes
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Discount applied
  discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount >= 0),
  original_price DECIMAL(10, 2) NOT NULL CHECK (original_price >= 0),
  final_price DECIMAL(10, 2) NOT NULL CHECK (final_price >= 0),
  
  -- Metadata
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_promo_code UNIQUE(promo_code_id, user_id, subscription_id)
);

-- Indexes for promo_code_redemptions
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_code_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_subscription ON promo_code_redemptions(subscription_id);

COMMENT ON TABLE promo_code_redemptions IS 'Track promo code usage by users';
COMMENT ON COLUMN promo_code_redemptions.discount_amount IS 'Actual discount amount applied (in NGN)';
COMMENT ON COLUMN promo_code_redemptions.original_price IS 'Original subscription price before discount';
COMMENT ON COLUMN promo_code_redemptions.final_price IS 'Final price after discount applied';

-- ============================================================================
-- SUBSCRIPTION NOTIFICATIONS TABLE
-- ============================================================================
-- Track renewal reminders and other subscription notifications
CREATE TABLE IF NOT EXISTS subscription_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'renewal_reminder', 
    'grace_period_start', 
    'grace_period_ending', 
    'subscription_expired',
    'payment_failed',
    'subscription_cancelled'
  )),
  
  -- Timing
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  -- Message details
  subject TEXT,
  message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscription_notifications
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_user ON subscription_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_subscription ON subscription_notifications(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_scheduled ON subscription_notifications(scheduled_for, status) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_type ON subscription_notifications(notification_type);

COMMENT ON TABLE subscription_notifications IS 'Track and schedule subscription-related notifications';
COMMENT ON COLUMN subscription_notifications.notification_type IS 'Type of notification: renewal_reminder (7 days before), grace_period_start, etc.';
COMMENT ON COLUMN subscription_notifications.scheduled_for IS 'When this notification should be sent';
COMMENT ON COLUMN subscription_notifications.status IS 'Notification status: pending, sent, failed, cancelled';

-- ============================================================================
-- ENHANCE SUBSCRIPTIONS TABLE FOR GRACE PERIOD
-- ============================================================================
-- Add grace period columns to existing subscriptions table
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS grace_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS in_grace_period BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id),
  ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10, 2) DEFAULT 0 CHECK (discount_applied >= 0);

-- Index for grace period queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period ON subscriptions(grace_period_end, in_grace_period) 
  WHERE in_grace_period = TRUE;

COMMENT ON COLUMN subscriptions.grace_period_start IS '3-day grace period start (when subscription expires)';
COMMENT ON COLUMN subscriptions.grace_period_end IS '3-day grace period end (3 days after expiration)';
COMMENT ON COLUMN subscriptions.in_grace_period IS 'Whether subscription is currently in grace period';
COMMENT ON COLUMN subscriptions.promo_code_id IS 'Promo code applied to this subscription';
COMMENT ON COLUMN subscriptions.discount_applied IS 'Discount amount applied from promo code (in NGN)';

-- ============================================================================
-- FUNCTIONS FOR PROMO CODE VALIDATION
-- ============================================================================

-- Function to validate promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_plan TEXT
)
RETURNS TABLE(
  is_valid BOOLEAN,
  promo_id UUID,
  discount_type TEXT,
  discount_value DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_redemptions INTEGER;
BEGIN
  -- Find active promo code
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = p_code
    AND is_active = TRUE
    AND valid_from <= NOW()
    AND valid_until >= NOW();
  
  -- Check if code exists
  IF v_promo.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::DECIMAL, 'Invalid or expired promo code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if plan is applicable
  IF NOT (p_plan = ANY(v_promo.applicable_plans)) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::DECIMAL, 'This promo code is not valid for the selected plan'::TEXT;
    RETURN;
  END IF;
  
  -- Check max uses (global)
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::DECIMAL, 'This promo code has reached its usage limit'::TEXT;
    RETURN;
  END IF;
  
  -- Check max uses per user
  SELECT COUNT(*) INTO v_user_redemptions
  FROM promo_code_redemptions
  WHERE promo_code_id = v_promo.id
    AND user_id = p_user_id;
  
  IF v_user_redemptions >= v_promo.max_uses_per_user THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::DECIMAL, 'You have already used this promo code'::TEXT;
    RETURN;
  END IF;
  
  -- Valid code
  RETURN QUERY SELECT 
    TRUE, 
    v_promo.id, 
    v_promo.discount_type, 
    v_promo.discount_value, 
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_promo_code IS 'Validates a promo code for a user and plan, returning validation result and discount details';

-- Function to calculate discount amount
CREATE OR REPLACE FUNCTION calculate_discount(
  p_original_price DECIMAL,
  p_discount_type TEXT,
  p_discount_value DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_discount DECIMAL;
BEGIN
  IF p_discount_type = 'percentage' THEN
    v_discount := p_original_price * (p_discount_value / 100.0);
  ELSE
    v_discount := LEAST(p_discount_value, p_original_price);
  END IF;
  
  -- Ensure discount doesn't exceed original price
  v_discount := LEAST(v_discount, p_original_price);
  
  -- Round to 2 decimal places
  RETURN ROUND(v_discount, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_discount IS 'Calculates discount amount based on discount type (percentage or fixed)';

-- ============================================================================
-- FUNCTIONS FOR GRACE PERIOD MANAGEMENT
-- ============================================================================

-- Function to start grace period
CREATE OR REPLACE FUNCTION start_grace_period(p_subscription_id UUID)
RETURNS void AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE id = p_subscription_id;
  
  IF v_subscription.id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  
  -- Start 3-day grace period
  UPDATE subscriptions
  SET 
    in_grace_period = TRUE,
    grace_period_start = NOW(),
    grace_period_end = NOW() + INTERVAL '3 days',
    status = 'grace_period',
    updated_at = NOW()
  WHERE id = p_subscription_id;
  
  -- Schedule grace period ending notification (1 day before grace period ends)
  INSERT INTO subscription_notifications (
    subscription_id,
    user_id,
    notification_type,
    scheduled_for,
    status,
    subject,
    message
  ) VALUES (
    p_subscription_id,
    v_subscription.user_id,
    'grace_period_ending',
    NOW() + INTERVAL '2 days', -- Notify 1 day before grace period ends
    'pending',
    'Your subscription is expiring soon',
    'Your premium subscription will expire in 1 day. Renew now to avoid losing access to premium features.'
  );
  
  -- Schedule expiration notification (at end of grace period)
  INSERT INTO subscription_notifications (
    subscription_id,
    user_id,
    notification_type,
    scheduled_for,
    status,
    subject,
    message
  ) VALUES (
    p_subscription_id,
    v_subscription.user_id,
    'subscription_expired',
    NOW() + INTERVAL '3 days', -- Notify when grace period ends
    'pending',
    'Your subscription has expired',
    'Your premium subscription has expired. Upgrade now to regain access to premium features.'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION start_grace_period IS 'Starts 3-day grace period for expired subscription and schedules notifications';

-- Function to end grace period and revoke access
CREATE OR REPLACE FUNCTION end_grace_period(p_subscription_id UUID)
RETURNS void AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE id = p_subscription_id;
  
  IF v_subscription.id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  
  -- Downgrade to basic
  UPDATE subscriptions
  SET 
    plan = 'basic',
    price = 0,
    status = 'expired',
    in_grace_period = FALSE,
    features = '{"unlimited_listings": false, "advanced_analytics": false, "priority_support": false, "custom_domain": false, "csv_export": false}'::jsonb,
    free_boosts_per_month = 0,
    free_boosts_remaining = 0,
    updated_at = NOW()
  WHERE id = p_subscription_id;
  
  -- Revoke premium features on user profile
  UPDATE auth.users
  SET 
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'is_premium', false,
      'premium_tier', 'basic',
      'premium_expires_at', NULL
    )
  WHERE id = v_subscription.user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION end_grace_period IS 'Ends grace period, downgrades subscription to basic, and revokes premium features';

-- ============================================================================
-- FUNCTION TO SCHEDULE RENEWAL REMINDERS
-- ============================================================================

-- Function to schedule renewal reminder (7 days before expiration)
CREATE OR REPLACE FUNCTION schedule_renewal_reminder(p_subscription_id UUID)
RETURNS void AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_reminder_date TIMESTAMPTZ;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE id = p_subscription_id;
  
  IF v_subscription.id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  
  -- Calculate reminder date (7 days before expiration)
  v_reminder_date := v_subscription.current_period_end - INTERVAL '7 days';
  
  -- Only schedule if reminder date is in the future
  IF v_reminder_date > NOW() THEN
    -- Delete existing renewal reminders for this subscription
    DELETE FROM subscription_notifications
    WHERE subscription_id = p_subscription_id
      AND notification_type = 'renewal_reminder'
      AND status = 'pending';
    
    -- Schedule new reminder
    INSERT INTO subscription_notifications (
      subscription_id,
      user_id,
      notification_type,
      scheduled_for,
      status,
      subject,
      message
    ) VALUES (
      p_subscription_id,
      v_subscription.user_id,
      'renewal_reminder',
      v_reminder_date,
      'pending',
      'Your subscription is renewing soon',
      FORMAT('Your %s subscription will renew on %s. Your card will be charged ₦%s.',
        UPPER(SUBSTRING(v_subscription.plan FROM 1 FOR 1)) || SUBSTRING(v_subscription.plan FROM 2),
        TO_CHAR(v_subscription.current_period_end, 'YYYY-MM-DD'),
        v_subscription.price
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION schedule_renewal_reminder IS 'Schedules renewal reminder notification 7 days before subscription renewal';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update promo_codes.updated_at
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER trigger_update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_promo_codes_updated_at();

-- Trigger to update subscription_notifications.updated_at
CREATE OR REPLACE FUNCTION update_subscription_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_notifications_updated_at ON subscription_notifications;
CREATE TRIGGER trigger_update_subscription_notifications_updated_at
  BEFORE UPDATE ON subscription_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_notifications_updated_at();

-- Trigger to schedule renewal reminder when subscription is created or updated
CREATE OR REPLACE FUNCTION auto_schedule_renewal_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule reminder if subscription is active and not in grace period
  IF NEW.status = 'active' AND NOT NEW.in_grace_period THEN
    PERFORM schedule_renewal_reminder(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_schedule_renewal_reminder ON subscriptions;
CREATE TRIGGER trigger_auto_schedule_renewal_reminder
  AFTER INSERT OR UPDATE OF current_period_end, status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_schedule_renewal_reminder();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on promo_codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Public can view active promo codes (for validation)
CREATE POLICY promo_codes_public_view ON promo_codes
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE AND valid_from <= NOW() AND valid_until >= NOW());

-- Only admins can manage promo codes (service role)
CREATE POLICY promo_codes_admin_all ON promo_codes
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on promo_code_redemptions
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY promo_redemptions_user_view ON promo_code_redemptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own redemptions
CREATE POLICY promo_redemptions_user_insert ON promo_code_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Service role can view all redemptions
CREATE POLICY promo_redemptions_service_all ON promo_code_redemptions
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on subscription_notifications
ALTER TABLE subscription_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY subscription_notifications_user_view ON subscription_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can manage all notifications
CREATE POLICY subscription_notifications_service_all ON subscription_notifications
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- SEED SAMPLE PROMO CODES
-- ============================================================================

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, applicable_plans, valid_from, valid_until, max_uses, duration_months)
VALUES 
  ('WELCOME20', '20% off first month for new subscribers', 'percentage', 20, ARRAY['pro', 'enterprise'], NOW(), NOW() + INTERVAL '1 year', NULL, 1),
  ('SAVE1000', '₦1,000 off Pro plan', 'fixed_amount', 1000, ARRAY['pro'], NOW(), NOW() + INTERVAL '6 months', 100, 1),
  ('ENTERPRISE50', '50% off Enterprise plan for 3 months', 'percentage', 50, ARRAY['enterprise'], NOW(), NOW() + INTERVAL '3 months', 50, 3)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 047: Subscription Management Enhancements completed successfully';
  RAISE NOTICE '  - Tables created: promo_codes, promo_code_redemptions, subscription_notifications';
  RAISE NOTICE '  - Subscriptions table enhanced with grace_period columns';
  RAISE NOTICE '  - Functions created: validate_promo_code, calculate_discount, start_grace_period, end_grace_period, schedule_renewal_reminder';
  RAISE NOTICE '  - Triggers created: Auto-update timestamps, auto-schedule renewal reminders';
  RAISE NOTICE '  - RLS policies enabled for all new tables';
  RAISE NOTICE '  - Sample promo codes seeded';
  RAISE NOTICE '  - Requirements: 24.6 (renewal reminders), 24.7 (grace period), 24.8 (promo codes), 24.9 (downgrades)';
END $$;
