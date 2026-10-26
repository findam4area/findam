-- Migration: Social Sharing and Gamification Infrastructure
-- Description: Create share_metrics, achievements, and user_levels tables for social and viral features

-- =====================================================
-- SHARE METRICS TABLE
-- =====================================================
-- Tracks social media shares and their performance
CREATE TABLE IF NOT EXISTS share_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sharer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Share details
  platform TEXT NOT NULL CHECK (
    platform IN ('whatsapp', 'twitter', 'facebook', 'instagram', 'other')
  ),
  share_url TEXT NOT NULL,
  referral_code TEXT, -- Embedded referral code for tracking
  
  -- Performance metrics
  views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
  clicks_count INTEGER DEFAULT 0 CHECK (clicks_count >= 0),
  conversions_count INTEGER DEFAULT 0 CHECK (conversions_count >= 0), -- Signups or purchases from this share
  
  -- Timestamps
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for share_metrics
CREATE INDEX idx_share_metrics_listing_id ON share_metrics(listing_id);
CREATE INDEX idx_share_metrics_sharer_id ON share_metrics(sharer_id);
CREATE INDEX idx_share_metrics_platform ON share_metrics(platform);
CREATE INDEX idx_share_metrics_shared_at ON share_metrics(shared_at DESC);
CREATE INDEX idx_share_metrics_referral_code ON share_metrics(referral_code) WHERE referral_code IS NOT NULL;

-- =====================================================
-- ACHIEVEMENTS TABLE
-- =====================================================
-- Stores available achievement badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Badge details
  badge_type TEXT NOT NULL UNIQUE, -- e.g., 'first_listing', 'first_sale', '10_sales', 'streak_7', 'level_5'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Icon name or URL
  
  -- Badge category
  category TEXT NOT NULL CHECK (
    category IN ('milestone', 'streak', 'level', 'special_event', 'seasonal', 'community')
  ),
  
  -- Requirements
  requirement_type TEXT NOT NULL CHECK (
    requirement_type IN ('listing_count', 'sale_count', 'review_count', 'referral_count', 'streak_days', 'level', 'special')
  ),
  requirement_value INTEGER, -- Threshold value (e.g., 10 for '10_sales')
  
  -- Display
  rarity TEXT DEFAULT 'common' CHECK (
    rarity IN ('common', 'rare', 'epic', 'legendary')
  ),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for achievements
CREATE INDEX idx_achievements_badge_type ON achievements(badge_type);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_is_active ON achievements(is_active) WHERE is_active = true;
CREATE INDEX idx_achievements_display_order ON achievements(display_order);

-- =====================================================
-- USER ACHIEVEMENTS TABLE
-- =====================================================
-- Tracks which achievements users have earned
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Display preferences
  is_displayed BOOLEAN DEFAULT false, -- Whether user chose to display this badge on profile
  display_order INTEGER DEFAULT 0, -- Order in which to display on profile
  
  -- Timestamps
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Indexes for user_achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at DESC);
CREATE INDEX idx_user_achievements_displayed ON user_achievements(user_id, is_displayed) WHERE is_displayed = true;

-- =====================================================
-- USER LEVELS TABLE
-- =====================================================
-- Tracks user progression and gamification stats
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Level and points
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  current_points INTEGER DEFAULT 0 CHECK (current_points >= 0),
  total_points INTEGER DEFAULT 0 CHECK (total_points >= 0), -- Lifetime points earned
  points_to_next_level INTEGER DEFAULT 100 CHECK (points_to_next_level >= 0),
  
  -- Streak tracking
  current_streak_days INTEGER DEFAULT 0 CHECK (current_streak_days >= 0),
  longest_streak_days INTEGER DEFAULT 0 CHECK (longest_streak_days >= 0),
  last_activity_date DATE,
  
  -- Activity stats
  listings_posted INTEGER DEFAULT 0 CHECK (listings_posted >= 0),
  items_sold INTEGER DEFAULT 0 CHECK (items_sold >= 0),
  items_purchased INTEGER DEFAULT 0 CHECK (items_purchased >= 0),
  reviews_given INTEGER DEFAULT 0 CHECK (reviews_given >= 0),
  referrals_made INTEGER DEFAULT 0 CHECK (referrals_made >= 0),
  
  -- Unlocked perks
  unlocked_perks JSONB DEFAULT '[]'::jsonb, -- Array of perk identifiers
  free_boosts_remaining INTEGER DEFAULT 0 CHECK (free_boosts_remaining >= 0),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user_levels
CREATE INDEX idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX idx_user_levels_level ON user_levels(level DESC);
CREATE INDEX idx_user_levels_total_points ON user_levels(total_points DESC);
CREATE INDEX idx_user_levels_current_streak ON user_levels(current_streak_days DESC);
CREATE INDEX idx_user_levels_last_activity ON user_levels(last_activity_date DESC);

-- =====================================================
-- POINTS HISTORY TABLE
-- =====================================================
-- Tracks all points earned/spent for audit trail
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Points transaction
  points_change INTEGER NOT NULL, -- Positive for earned, negative for spent
  points_after INTEGER NOT NULL CHECK (points_after >= 0),
  
  -- Reason
  activity_type TEXT NOT NULL CHECK (
    activity_type IN ('listing_posted', 'item_sold', 'item_purchased', 'review_given', 'referral_made', 'daily_login', 'challenge_completed', 'level_up', 'perk_redeemed')
  ),
  description TEXT,
  reference_id UUID, -- ID of related entity (listing, review, etc.)
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for points_history
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_points_history_created_at ON points_history(created_at DESC);
CREATE INDEX idx_points_history_activity_type ON points_history(activity_type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE share_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Share Metrics Policies
-- Users can view their own share metrics
CREATE POLICY "Users can view their own share metrics"
  ON share_metrics FOR SELECT
  USING (auth.uid() = sharer_id);

-- Users can create share metrics
CREATE POLICY "Users can create share metrics"
  ON share_metrics FOR INSERT
  WITH CHECK (auth.uid() = sharer_id);

-- System can update share metrics (for tracking views/conversions)
CREATE POLICY "System can update share metrics"
  ON share_metrics FOR UPDATE
  USING (true);

-- Achievements Policies
-- Anyone can view active achievements
CREATE POLICY "Anyone can view active achievements"
  ON achievements FOR SELECT
  USING (is_active = true);

-- Only service role can manage achievements
CREATE POLICY "Service role can manage achievements"
  ON achievements FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- User Achievements Policies
-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view others' displayed achievements
CREATE POLICY "Users can view others displayed achievements"
  ON user_achievements FOR SELECT
  USING (is_displayed = true);

-- System can insert user achievements
CREATE POLICY "System can insert user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Users can update their achievement display preferences
CREATE POLICY "Users can update their achievement display"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Levels Policies
-- Users can view their own level
CREATE POLICY "Users can view their own level"
  ON user_levels FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view others' levels (for leaderboard)
CREATE POLICY "Users can view others levels"
  ON user_levels FOR SELECT
  USING (true);

-- System can manage user levels
CREATE POLICY "System can manage user levels"
  ON user_levels FOR ALL
  USING (true);

-- Points History Policies
-- Users can view their own points history
CREATE POLICY "Users can view their own points history"
  ON points_history FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert points history
CREATE POLICY "System can insert points history"
  ON points_history FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update share_metrics updated_at timestamp
CREATE OR REPLACE FUNCTION update_share_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER share_metrics_updated_at
  BEFORE UPDATE ON share_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_share_metrics_updated_at();

-- Function to update achievements updated_at timestamp
CREATE OR REPLACE FUNCTION update_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_achievements_updated_at();

-- Function to update user_levels updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_levels_updated_at
  BEFORE UPDATE ON user_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_user_levels_updated_at();

-- Function to initialize user level on user creation
CREATE OR REPLACE FUNCTION initialize_user_level()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_levels (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER initialize_user_level_on_signup
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_level();

-- Function to update streak on activity
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  current_date DATE := CURRENT_DATE;
BEGIN
  last_date := NEW.last_activity_date;
  
  -- If activity is today, no change needed
  IF last_date = current_date THEN
    RETURN NEW;
  END IF;
  
  -- If activity was yesterday, increment streak
  IF last_date = current_date - INTERVAL '1 day' THEN
    NEW.current_streak_days := NEW.current_streak_days + 1;
    
    -- Update longest streak if current is higher
    IF NEW.current_streak_days > NEW.longest_streak_days THEN
      NEW.longest_streak_days := NEW.current_streak_days;
    END IF;
  -- If activity was more than 1 day ago, reset streak
  ELSIF last_date < current_date - INTERVAL '1 day' OR last_date IS NULL THEN
    NEW.current_streak_days := 1;
  END IF;
  
  NEW.last_activity_date := current_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_streak_on_activity
  BEFORE UPDATE ON user_levels
  FOR EACH ROW
  WHEN (OLD.last_activity_date IS DISTINCT FROM NEW.last_activity_date)
  EXECUTE FUNCTION update_user_streak();

-- Function to check and award level-based achievements
CREATE OR REPLACE FUNCTION check_level_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
BEGIN
  -- Check if user reached a new level
  IF NEW.level > OLD.level THEN
    -- Find level-based achievements
    FOR achievement_record IN
      SELECT id FROM achievements
      WHERE requirement_type = 'level'
      AND requirement_value = NEW.level
      AND is_active = true
    LOOP
      -- Award achievement if not already earned
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, achievement_record.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_level_achievements_on_level_up
  AFTER UPDATE ON user_levels
  FOR EACH ROW
  WHEN (NEW.level > OLD.level)
  EXECUTE FUNCTION check_level_achievements();

-- Function to calculate points needed for next level
CREATE OR REPLACE FUNCTION calculate_points_to_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Formula: 100 * level (increases linearly)
  -- Level 1->2: 100 points, Level 2->3: 200 points, etc.
  RETURN 100 * current_level;
END;
$$ LANGUAGE plpgsql;

-- Function to add points and handle level ups
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  v_current_level INTEGER;
  v_current_points INTEGER;
  v_total_points INTEGER;
  v_points_to_next INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN := false;
BEGIN
  -- Get current user level data
  SELECT level, current_points, total_points, points_to_next_level
  INTO v_current_level, v_current_points, v_total_points, v_points_to_next
  FROM user_levels
  WHERE user_id = p_user_id;
  
  -- Add points
  v_current_points := v_current_points + p_points;
  v_total_points := v_total_points + p_points;
  v_new_level := v_current_level;
  
  -- Check for level up
  WHILE v_current_points >= v_points_to_next LOOP
    v_current_points := v_current_points - v_points_to_next;
    v_new_level := v_new_level + 1;
    v_points_to_next := calculate_points_to_next_level(v_new_level);
    v_leveled_up := true;
  END LOOP;
  
  -- Update user level
  UPDATE user_levels
  SET 
    level = v_new_level,
    current_points = v_current_points,
    total_points = v_total_points,
    points_to_next_level = v_points_to_next,
    last_activity_date = CURRENT_DATE
  WHERE user_id = p_user_id;
  
  -- Record points history
  INSERT INTO points_history (user_id, points_change, points_after, activity_type, description, reference_id)
  VALUES (p_user_id, p_points, v_current_points, p_activity_type, p_description, p_reference_id);
  
  RETURN QUERY SELECT v_new_level, v_leveled_up;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA - Default Achievements
-- =====================================================

-- Milestone achievements
INSERT INTO achievements (badge_type, name, description, icon, category, requirement_type, requirement_value, rarity, display_order) VALUES
('first_listing', 'First Steps', 'Posted your first listing', 'package', 'milestone', 'listing_count', 1, 'common', 1),
('first_sale', 'First Sale', 'Made your first sale', 'shopping-bag', 'milestone', 'sale_count', 1, 'common', 2),
('10_sales', 'Rising Star', 'Completed 10 sales', 'star', 'milestone', 'sale_count', 10, 'rare', 3),
('50_sales', 'Power Seller', 'Completed 50 sales', 'zap', 'milestone', 'sale_count', 50, 'epic', 4),
('100_sales', 'Marketplace Legend', 'Completed 100 sales', 'crown', 'milestone', 'sale_count', 100, 'legendary', 5),
('first_review', 'Helpful Reviewer', 'Left your first review', 'message-circle', 'milestone', 'review_count', 1, 'common', 6),
('10_reviews', 'Community Voice', 'Left 10 reviews', 'message-square', 'milestone', 'review_count', 10, 'rare', 7),
('first_referral', 'Friend Bringer', 'Referred your first user', 'user-plus', 'milestone', 'referral_count', 1, 'common', 8),
('10_referrals', 'Community Builder', 'Referred 10 users', 'users', 'milestone', 'referral_count', 10, 'epic', 9)
ON CONFLICT (badge_type) DO NOTHING;

-- Streak achievements
INSERT INTO achievements (badge_type, name, description, icon, category, requirement_type, requirement_value, rarity, display_order) VALUES
('streak_7', 'Week Warrior', '7-day activity streak', 'flame', 'streak', 'streak_days', 7, 'rare', 10),
('streak_30', 'Monthly Master', '30-day activity streak', 'fire', 'streak', 'streak_days', 30, 'epic', 11),
('streak_100', 'Unstoppable', '100-day activity streak', 'award', 'streak', 'streak_days', 100, 'legendary', 12)
ON CONFLICT (badge_type) DO NOTHING;

-- Level achievements
INSERT INTO achievements (badge_type, name, description, icon, category, requirement_type, requirement_value, rarity, display_order) VALUES
('level_5', 'Level 5', 'Reached level 5', 'trending-up', 'level', 'level', 5, 'common', 13),
('level_10', 'Level 10', 'Reached level 10', 'bar-chart', 'level', 'level', 10, 'rare', 14),
('level_25', 'Level 25', 'Reached level 25', 'bar-chart-2', 'level', 'level', 25, 'epic', 15),
('level_50', 'Level 50', 'Reached level 50', 'activity', 'level', 'level', 50, 'legendary', 16)
ON CONFLICT (badge_type) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE share_metrics IS 'Tracks social media shares and their performance metrics';
COMMENT ON TABLE achievements IS 'Stores available achievement badges that users can earn';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements users have earned';
COMMENT ON TABLE user_levels IS 'Tracks user progression, points, streaks, and gamification stats';
COMMENT ON TABLE points_history IS 'Audit trail of all points earned and spent by users';

COMMENT ON COLUMN share_metrics.platform IS 'Social media platform where listing was shared';
COMMENT ON COLUMN share_metrics.conversions_count IS 'Number of signups or purchases from this share';
COMMENT ON COLUMN achievements.requirement_type IS 'Type of requirement to earn this achievement';
COMMENT ON COLUMN achievements.requirement_value IS 'Threshold value needed to earn achievement';
COMMENT ON COLUMN user_achievements.is_displayed IS 'Whether user chose to display this badge on their profile';
COMMENT ON COLUMN user_levels.current_points IS 'Points in current level towards next level';
COMMENT ON COLUMN user_levels.total_points IS 'Lifetime total points earned';
COMMENT ON COLUMN user_levels.unlocked_perks IS 'JSON array of perk identifiers unlocked by leveling up';
