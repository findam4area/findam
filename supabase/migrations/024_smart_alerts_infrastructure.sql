-- Migration: Smart Alerts Infrastructure
-- Tasks: 41.1, 41.2
-- Requirements: 13.1, 13.2, 13.4, 13.6, 13.8

-- =====================================================
-- 1. SAVED_SEARCHES TABLE (Task 41.1)
-- =====================================================
-- Store user search queries with filters and notification preferences

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- User-defined name for the search
  
  -- Search query parameters (stored as JSONB for flexibility)
  query JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "keywords": "...", "category": "...", "priceRange": { "min": 0, "max": 100000 }, "location": [...], "condition": [...] }
  
  -- Notification settings
  notification_frequency TEXT NOT NULL DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'daily', 'weekly')),
  is_paused BOOLEAN DEFAULT false,
  
  -- Match tracking
  new_match_count INTEGER DEFAULT 0 CHECK (new_match_count >= 0),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auto-disable after inactivity
  last_activity_at TIMESTAMPTZ DEFAULT NOW(), -- Updated when user views matches or modifies search
  is_active BOOLEAN DEFAULT true,
  disabled_at TIMESTAMPTZ,
  disabled_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT query_not_empty CHECK (jsonb_typeof(query) = 'object')
);

-- Indexes for performance
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;
CREATE INDEX idx_saved_searches_paused ON saved_searches(is_paused) WHERE is_paused = false;
CREATE INDEX idx_saved_searches_last_checked ON saved_searches(last_checked);
CREATE INDEX idx_saved_searches_notification_freq ON saved_searches(notification_frequency);
CREATE INDEX idx_saved_searches_query ON saved_searches USING GIN (query);
CREATE INDEX idx_saved_searches_last_activity ON saved_searches(last_activity_at);
CREATE INDEX idx_saved_searches_user_active ON saved_searches(user_id, is_active) WHERE is_active = true;

-- =====================================================
-- 2. SEARCH_ALERTS TABLE (Task 41.2)
-- =====================================================
-- Track individual alerts sent for matching listings

CREATE TABLE IF NOT EXISTS search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('new_listing', 'price_drop')),
  
  -- Price drop specific fields
  previous_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  price_drop_percentage DECIMAL(5,2),
  
  -- Notification tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  notification_method TEXT DEFAULT 'push' CHECK (notification_method IN ('push', 'email', 'sms', 'digest')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  listing_snapshot JSONB, -- Store key listing details at time of alert
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT price_drop_fields_required CHECK (
    (alert_type = 'price_drop' AND previous_price IS NOT NULL AND new_price IS NOT NULL AND price_drop_percentage IS NOT NULL)
    OR alert_type = 'new_listing'
  ),
  CONSTRAINT price_drop_valid CHECK (
    alert_type != 'price_drop' OR (new_price < previous_price AND price_drop_percentage > 0)
  ),
  
  -- Prevent duplicate alerts for same listing and search
  UNIQUE(saved_search_id, listing_id, alert_type, sent_at)
);

-- Indexes for performance
CREATE INDEX idx_search_alerts_saved_search ON search_alerts(saved_search_id);
CREATE INDEX idx_search_alerts_listing ON search_alerts(listing_id);
CREATE INDEX idx_search_alerts_user ON search_alerts(user_id);
CREATE INDEX idx_search_alerts_type ON search_alerts(alert_type);
CREATE INDEX idx_search_alerts_sent_at ON search_alerts(sent_at DESC);
CREATE INDEX idx_search_alerts_unread ON search_alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_search_alerts_user_unread ON search_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_search_alerts_user_sent ON search_alerts(user_id, sent_at DESC);

-- =====================================================
-- 3. LISTING_PRICE_HISTORY TABLE
-- =====================================================
-- Track price changes for listings to enable price drop alerts

CREATE TABLE IF NOT EXISTS listing_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  previous_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  price_change DECIMAL(10,2) GENERATED ALWAYS AS (new_price - previous_price) STORED,
  price_change_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN previous_price > 0 THEN ((new_price - previous_price) / previous_price * 100)
      ELSE 0
    END
  ) STORED,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT prices_positive CHECK (previous_price >= 0 AND new_price >= 0)
);

-- Indexes for performance
CREATE INDEX idx_listing_price_history_listing ON listing_price_history(listing_id);
CREATE INDEX idx_listing_price_history_changed_at ON listing_price_history(changed_at DESC);
CREATE INDEX idx_listing_price_history_listing_date ON listing_price_history(listing_id, changed_at DESC);

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for saved_searches updated_at
CREATE TRIGGER trigger_saved_searches_updated_at
BEFORE UPDATE ON saved_searches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-disable inactive saved searches (90 days)
CREATE OR REPLACE FUNCTION auto_disable_inactive_searches()
RETURNS void AS $$
BEGIN
  UPDATE saved_searches
  SET 
    is_active = false,
    disabled_at = NOW(),
    disabled_reason = 'Auto-disabled after 90 days of inactivity',
    updated_at = NOW()
  WHERE 
    is_active = true
    AND last_activity_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to increment new match count
CREATE OR REPLACE FUNCTION increment_search_match_count(search_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE saved_searches
  SET 
    new_match_count = new_match_count + 1,
    last_checked = NOW(),
    updated_at = NOW()
  WHERE id = search_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reset new match count (when user views matches)
CREATE OR REPLACE FUNCTION reset_search_match_count(search_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE saved_searches
  SET 
    new_match_count = 0,
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE id = search_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark alert as read
CREATE OR REPLACE FUNCTION mark_alert_read(alert_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE search_alerts
  SET 
    is_read = true,
    read_at = NOW()
  WHERE id = alert_id AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Function to track listing price changes
CREATE OR REPLACE FUNCTION track_listing_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if price actually changed
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO listing_price_history (
      listing_id,
      previous_price,
      new_price
    ) VALUES (
      NEW.id,
      OLD.price,
      NEW.price
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track price changes on listings table
CREATE TRIGGER trigger_track_listing_price_change
AFTER UPDATE ON listings
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price)
EXECUTE FUNCTION track_listing_price_change();

-- Function to get user's saved search count
CREATE OR REPLACE FUNCTION get_user_saved_search_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  search_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO search_count
  FROM saved_searches
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN search_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create more saved searches
CREATE OR REPLACE FUNCTION can_create_saved_search(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  is_premium BOOLEAN;
  max_searches INTEGER;
BEGIN
  -- Get current count
  current_count := get_user_saved_search_count(p_user_id);
  
  -- Check if user is premium (assuming subscription_tier column in users table)
  SELECT COALESCE(subscription_tier IN ('pro', 'business'), false)
  INTO is_premium
  FROM users
  WHERE id = p_user_id;
  
  -- Set limit based on tier
  IF is_premium THEN
    max_searches := 999999; -- Effectively unlimited
  ELSE
    max_searches := 3; -- Free tier limit
  END IF;
  
  RETURN current_count < max_searches;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_price_history ENABLE ROW LEVEL SECURITY;

-- Saved searches policies
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND can_create_saved_search(auth.uid())
  );

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Search alerts policies
CREATE POLICY "Users can view their own alerts"
  ON search_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create alerts"
  ON search_alerts FOR INSERT
  WITH CHECK (true); -- Alerts are created by background jobs

CREATE POLICY "Users can update their own alerts"
  ON search_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Listing price history policies
CREATE POLICY "Anyone can view price history"
  ON listing_price_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert price history"
  ON listing_price_history FOR INSERT
  WITH CHECK (true); -- Price history is created by triggers

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE saved_searches IS 'User-defined search queries with notification preferences for smart alerts';
COMMENT ON TABLE search_alerts IS 'Individual alerts sent to users for matching listings or price drops';
COMMENT ON TABLE listing_price_history IS 'Historical record of price changes for listings to enable price drop detection';

COMMENT ON COLUMN saved_searches.query IS 'Search parameters stored as JSONB: keywords, category, priceRange, location, condition';
COMMENT ON COLUMN saved_searches.notification_frequency IS 'How often to send notifications: instant, daily digest, or weekly digest';
COMMENT ON COLUMN saved_searches.new_match_count IS 'Number of new matches since last checked by user';
COMMENT ON COLUMN saved_searches.last_checked IS 'Last time the system checked for new matches';
COMMENT ON COLUMN saved_searches.last_activity_at IS 'Last time user interacted with this search (for auto-disable)';
COMMENT ON COLUMN saved_searches.is_active IS 'Whether search is active (auto-disabled after 90 days inactivity)';

COMMENT ON COLUMN search_alerts.alert_type IS 'Type of alert: new_listing or price_drop';
COMMENT ON COLUMN search_alerts.price_drop_percentage IS 'Percentage decrease in price (for price_drop alerts)';
COMMENT ON COLUMN search_alerts.notification_method IS 'How the alert was delivered: push, email, sms, or digest';
COMMENT ON COLUMN search_alerts.listing_snapshot IS 'Key listing details at time of alert (for historical reference)';

COMMENT ON COLUMN listing_price_history.price_change_percentage IS 'Computed: percentage change from previous to new price';

-- =====================================================
-- 7. INITIAL DATA / SETUP
-- =====================================================

-- Create a function to be called by cron job for auto-disabling inactive searches
-- This should be scheduled to run daily
COMMENT ON FUNCTION auto_disable_inactive_searches() IS 'Cron job function: Auto-disable saved searches inactive for 90+ days. Schedule to run daily.';

-- =====================================================
-- 8. GRANTS (if needed for service role)
-- =====================================================

-- Grant necessary permissions for background jobs
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
