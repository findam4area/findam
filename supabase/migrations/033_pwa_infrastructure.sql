-- Migration: PWA Infrastructure
-- Description: Set up tables for Progressive Web App features including low-data mode and offline capabilities

-- ============================================================================
-- PWA SETTINGS TABLE
-- ============================================================================
-- Stores user preferences for PWA features like low-data mode and offline caching

CREATE TABLE IF NOT EXISTS pwa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Feature flags
  low_data_mode BOOLEAN DEFAULT false,
  offline_cache_enabled BOOLEAN DEFAULT true,
  auto_sync_enabled BOOLEAN DEFAULT true,
  
  -- Data usage tracking
  data_usage_mb DECIMAL(10, 2) DEFAULT 0,
  data_usage_reset_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_sync_at TIMESTAMPTZ,
  
  -- Cache settings
  cache_size_mb DECIMAL(10, 2) DEFAULT 0,
  max_cache_size_mb DECIMAL(10, 2) DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_user_pwa_settings UNIQUE(user_id),
  CONSTRAINT valid_data_usage CHECK (data_usage_mb >= 0),
  CONSTRAINT valid_cache_size CHECK (cache_size_mb >= 0 AND cache_size_mb <= max_cache_size_mb)
);

-- Indexes for PWA settings
CREATE INDEX idx_pwa_settings_user_id ON pwa_settings(user_id);
CREATE INDEX idx_pwa_settings_low_data_mode ON pwa_settings(low_data_mode) WHERE low_data_mode = true;
CREATE INDEX idx_pwa_settings_last_sync ON pwa_settings(last_sync_at);

-- ============================================================================
-- OFFLINE ACTIONS TABLE
-- ============================================================================
-- Queues actions performed while offline for later synchronization

CREATE TABLE IF NOT EXISTS offline_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Action details
  action_type VARCHAR(50) NOT NULL, -- 'create_listing', 'update_listing', 'send_message', 'like_listing', etc.
  action_data JSONB NOT NULL, -- Stores the action payload
  
  -- Sync status
  sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed'
  sync_attempts INTEGER DEFAULT 0,
  last_sync_attempt_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- Priority and ordering
  priority INTEGER DEFAULT 0, -- Higher priority syncs first
  sequence_number BIGSERIAL, -- Ensures actions are synced in order
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  
  -- Constraints
  CONSTRAINT valid_sync_status CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
  CONSTRAINT valid_action_type CHECK (action_type IN (
    'create_listing',
    'update_listing',
    'delete_listing',
    'send_message',
    'like_listing',
    'unlike_listing',
    'save_listing',
    'unsave_listing',
    'create_review',
    'update_profile',
    'create_offer',
    'accept_offer',
    'reject_offer'
  )),
  CONSTRAINT valid_sync_attempts CHECK (sync_attempts >= 0),
  CONSTRAINT valid_priority CHECK (priority >= 0)
);

-- Indexes for offline actions
CREATE INDEX idx_offline_actions_user_id ON offline_actions(user_id);
CREATE INDEX idx_offline_actions_sync_status ON offline_actions(sync_status) WHERE sync_status IN ('pending', 'failed');
CREATE INDEX idx_offline_actions_priority_sequence ON offline_actions(priority DESC, sequence_number ASC) WHERE sync_status = 'pending';
CREATE INDEX idx_offline_actions_created_at ON offline_actions(created_at);
CREATE INDEX idx_offline_actions_expires_at ON offline_actions(expires_at) WHERE sync_status != 'synced';

-- ============================================================================
-- CACHED LISTINGS TABLE
-- ============================================================================
-- Stores listings cached for offline access

CREATE TABLE IF NOT EXISTS cached_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  
  -- Cache data
  listing_data JSONB NOT NULL, -- Full listing data including media
  cache_size_kb INTEGER NOT NULL,
  
  -- Cache metadata
  last_accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  cached_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_user_cached_listing UNIQUE(user_id, listing_id),
  CONSTRAINT valid_cache_size CHECK (cache_size_kb > 0)
);

-- Indexes for cached listings
CREATE INDEX idx_cached_listings_user_id ON cached_listings(user_id);
CREATE INDEX idx_cached_listings_listing_id ON cached_listings(listing_id);
CREATE INDEX idx_cached_listings_last_accessed ON cached_listings(last_accessed_at);
CREATE INDEX idx_cached_listings_expires_at ON cached_listings(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE pwa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_listings ENABLE ROW LEVEL SECURITY;

-- PWA Settings Policies
CREATE POLICY "Users can view their own PWA settings"
  ON pwa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PWA settings"
  ON pwa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PWA settings"
  ON pwa_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PWA settings"
  ON pwa_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Offline Actions Policies
CREATE POLICY "Users can view their own offline actions"
  ON offline_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own offline actions"
  ON offline_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offline actions"
  ON offline_actions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offline actions"
  ON offline_actions FOR DELETE
  USING (auth.uid() = user_id);

-- Cached Listings Policies
CREATE POLICY "Users can view their own cached listings"
  ON cached_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached listings"
  ON cached_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cached listings"
  ON cached_listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cached listings"
  ON cached_listings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp for pwa_settings
CREATE TRIGGER update_pwa_settings_updated_at
  BEFORE UPDATE ON pwa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for offline_actions
CREATE TRIGGER update_offline_actions_updated_at
  BEFORE UPDATE ON offline_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for cached_listings
CREATE TRIGGER update_cached_listings_updated_at
  BEFORE UPDATE ON cached_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get pending offline actions for a user
CREATE OR REPLACE FUNCTION get_pending_offline_actions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  action_type VARCHAR,
  action_data JSONB,
  priority INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oa.id,
    oa.action_type,
    oa.action_data,
    oa.priority,
    oa.created_at
  FROM offline_actions oa
  WHERE oa.user_id = p_user_id
    AND oa.sync_status = 'pending'
    AND oa.expires_at > CURRENT_TIMESTAMP
  ORDER BY oa.priority DESC, oa.sequence_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark offline action as synced
CREATE OR REPLACE FUNCTION mark_action_synced(p_action_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE offline_actions
  SET 
    sync_status = 'synced',
    synced_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_action_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark offline action as failed
CREATE OR REPLACE FUNCTION mark_action_failed(
  p_action_id UUID,
  p_error_message TEXT,
  p_error_code VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE offline_actions
  SET 
    sync_status = 'failed',
    sync_attempts = sync_attempts + 1,
    last_sync_attempt_at = CURRENT_TIMESTAMP,
    error_message = p_error_message,
    error_code = p_error_code,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_action_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired offline actions
CREATE OR REPLACE FUNCTION cleanup_expired_offline_actions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM offline_actions
  WHERE expires_at < CURRENT_TIMESTAMP
    AND sync_status != 'synced';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired cached listings
CREATE OR REPLACE FUNCTION cleanup_expired_cached_listings()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cached_listings
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's cache usage
CREATE OR REPLACE FUNCTION get_user_cache_usage(p_user_id UUID)
RETURNS TABLE (
  total_cached_listings INTEGER,
  total_cache_size_mb DECIMAL,
  oldest_cache_date TIMESTAMPTZ,
  newest_cache_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_cached_listings,
    ROUND(SUM(cache_size_kb) / 1024.0, 2) as total_cache_size_mb,
    MIN(cached_at) as oldest_cache_date,
    MAX(cached_at) as newest_cache_date
  FROM cached_listings
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update PWA data usage
CREATE OR REPLACE FUNCTION update_data_usage(
  p_user_id UUID,
  p_data_mb DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO pwa_settings (user_id, data_usage_mb)
  VALUES (p_user_id, p_data_mb)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    data_usage_mb = pwa_settings.data_usage_mb + p_data_mb,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset data usage (monthly reset)
CREATE OR REPLACE FUNCTION reset_data_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pwa_settings
  SET 
    data_usage_mb = 0,
    data_usage_reset_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE pwa_settings IS 'Stores user preferences for PWA features including low-data mode and offline caching';
COMMENT ON TABLE offline_actions IS 'Queues actions performed while offline for later synchronization';
COMMENT ON TABLE cached_listings IS 'Stores listings cached for offline access';

COMMENT ON COLUMN pwa_settings.low_data_mode IS 'When enabled, reduces data usage by compressing images and disabling video auto-play';
COMMENT ON COLUMN pwa_settings.offline_cache_enabled IS 'When enabled, caches listings for offline access';
COMMENT ON COLUMN pwa_settings.data_usage_mb IS 'Total data usage in megabytes since last reset';
COMMENT ON COLUMN pwa_settings.last_sync_at IS 'Timestamp of last successful sync';

COMMENT ON COLUMN offline_actions.action_type IS 'Type of action performed offline (e.g., create_listing, send_message)';
COMMENT ON COLUMN offline_actions.action_data IS 'JSON payload containing the action data';
COMMENT ON COLUMN offline_actions.sync_status IS 'Current sync status: pending, syncing, synced, or failed';
COMMENT ON COLUMN offline_actions.priority IS 'Higher priority actions are synced first';
COMMENT ON COLUMN offline_actions.sequence_number IS 'Ensures actions are synced in the order they were created';

COMMENT ON COLUMN cached_listings.listing_data IS 'Full listing data including media URLs for offline access';
COMMENT ON COLUMN cached_listings.cache_size_kb IS 'Size of cached data in kilobytes';
COMMENT ON COLUMN cached_listings.last_accessed_at IS 'Timestamp of last access, used for cache eviction';
