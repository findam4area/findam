-- Migration: Seller Storefront Infrastructure
-- Tasks: 12.1, 12.2, 12.3
-- Requirements: 9.1, 9.4, 9.8, 10.1, 10.3, 10.4, 11.1, 11.4, 11.8

-- =====================================================
-- 1. STOREFRONTS TABLE (Task 12.1)
-- =====================================================
-- Custom branded seller pages with URLs, banners, themes, and featured products

CREATE TABLE IF NOT EXISTS storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  custom_url TEXT NOT NULL UNIQUE, -- e.g., "johndoe" for findamng.com/store/johndoe
  display_name TEXT,
  bio TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT '#3B82F6', -- Hex color code
  featured_listings UUID[] DEFAULT '{}', -- Array of up to 6 listing IDs
  custom_domain TEXT UNIQUE, -- Premium feature
  follower_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT custom_url_format CHECK (custom_url ~ '^[a-z0-9_-]{3,30}$'),
  CONSTRAINT theme_color_format CHECK (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT featured_listings_limit CHECK (array_length(featured_listings, 1) <= 6)
);

-- Indexes for performance
CREATE INDEX idx_storefronts_user_id ON storefronts(user_id);
CREATE UNIQUE INDEX idx_storefronts_custom_url ON storefronts(custom_url);
CREATE INDEX idx_storefronts_custom_domain ON storefronts(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_storefronts_active ON storefronts(is_active) WHERE is_active = true;

-- =====================================================
-- 2. SELLER_ANALYTICS TABLE (Task 12.2)
-- =====================================================
-- Track seller performance metrics with geographic and traffic source breakdowns

CREATE TABLE IF NOT EXISTS seller_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Core metrics
  total_views INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  
  -- Conversion metrics
  total_messages INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage (views to sales)
  message_conversion_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage (messages to sales)
  
  -- Response metrics
  average_response_time_minutes INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  
  -- Revenue metrics
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  average_order_value DECIMAL(10,2) DEFAULT 0.00,
  
  -- Geographic breakdown (JSONB for flexibility)
  geographic_data JSONB DEFAULT '{}'::jsonb, -- { "Lagos": 150, "Abuja": 75, ... }
  
  -- Traffic sources
  traffic_sources JSONB DEFAULT '{}'::jsonb, -- { "direct": 100, "search": 50, "social": 25, "referral": 10 }
  
  -- Top performing listings
  top_listings JSONB DEFAULT '[]'::jsonb, -- [{ "listing_id": "...", "views": 100, "sales": 5 }, ...]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries
  UNIQUE(user_id, date, period_type)
);

-- Indexes for performance
CREATE INDEX idx_seller_analytics_user_id ON seller_analytics(user_id);
CREATE INDEX idx_seller_analytics_date ON seller_analytics(date DESC);
CREATE INDEX idx_seller_analytics_period ON seller_analytics(period_type);
CREATE INDEX idx_seller_analytics_user_date ON seller_analytics(user_id, date DESC);
CREATE INDEX idx_seller_analytics_geographic ON seller_analytics USING GIN (geographic_data);
CREATE INDEX idx_seller_analytics_traffic ON seller_analytics USING GIN (traffic_sources);

-- =====================================================
-- 3. INVENTORY_ITEMS TABLE (Task 12.3)
-- =====================================================
-- Track stock quantities and variants for listings

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stock tracking
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_sold_out BOOLEAN GENERATED ALWAYS AS (stock_quantity = 0) STORED,
  
  -- Variant support (JSONB for flexibility)
  variants JSONB DEFAULT '[]'::jsonb, -- [{ "id": "...", "name": "Red - Large", "attributes": { "color": "Red", "size": "Large" }, "stock": 10, "sku": "..." }, ...]
  has_variants BOOLEAN DEFAULT false,
  
  -- Stock history tracking
  last_stock_update TIMESTAMPTZ DEFAULT NOW(),
  last_restock_date TIMESTAMPTZ,
  
  -- Inventory value
  unit_price DECIMAL(10,2) DEFAULT 0.00,
  total_value DECIMAL(12,2) GENERATED ALWAYS AS (stock_quantity * unit_price) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one inventory record per listing
  UNIQUE(listing_id)
);

-- Indexes for performance
CREATE INDEX idx_inventory_listing_id ON inventory_items(listing_id);
CREATE INDEX idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX idx_inventory_sold_out ON inventory_items(is_sold_out) WHERE is_sold_out = true;
CREATE INDEX idx_inventory_low_stock ON inventory_items(stock_quantity) WHERE stock_quantity <= low_stock_threshold AND stock_quantity > 0;
CREATE INDEX idx_inventory_variants ON inventory_items USING GIN (variants);

-- =====================================================
-- 4. STOCK_HISTORY TABLE
-- =====================================================
-- Audit trail for all stock changes

CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Change details
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  change_amount INTEGER GENERATED ALWAYS AS (new_quantity - previous_quantity) STORED,
  change_reason TEXT NOT NULL CHECK (change_reason IN ('sale', 'restock', 'adjustment', 'return', 'initial')),
  
  -- Variant tracking (if applicable)
  variant_id TEXT,
  variant_name TEXT,
  
  -- Metadata
  notes TEXT,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stock_history_inventory_id ON stock_history(inventory_id);
CREATE INDEX idx_stock_history_listing_id ON stock_history(listing_id);
CREATE INDEX idx_stock_history_user_id ON stock_history(user_id);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at DESC);
CREATE INDEX idx_stock_history_reason ON stock_history(change_reason);

-- =====================================================
-- 5. STOREFRONT_FOLLOWERS TABLE
-- =====================================================
-- Track users following seller storefronts

CREATE TABLE IF NOT EXISTS storefront_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
  follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one follow per user per storefront
  UNIQUE(storefront_id, follower_user_id)
);

-- Indexes for performance
CREATE INDEX idx_storefront_followers_storefront ON storefront_followers(storefront_id);
CREATE INDEX idx_storefront_followers_user ON storefront_followers(follower_user_id);
CREATE INDEX idx_storefront_followers_date ON storefront_followers(followed_at DESC);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to update storefront follower count
CREATE OR REPLACE FUNCTION update_storefront_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE storefronts
    SET follower_count = follower_count + 1,
        updated_at = NOW()
    WHERE id = NEW.storefront_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE storefronts
    SET follower_count = GREATEST(0, follower_count - 1),
        updated_at = NOW()
    WHERE id = OLD.storefront_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follower count updates
CREATE TRIGGER trigger_update_storefront_follower_count
AFTER INSERT OR DELETE ON storefront_followers
FOR EACH ROW
EXECUTE FUNCTION update_storefront_follower_count();

-- Function to log stock changes
CREATE OR REPLACE FUNCTION log_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if stock quantity changed
  IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
    INSERT INTO stock_history (
      inventory_id,
      listing_id,
      user_id,
      previous_quantity,
      new_quantity,
      change_reason,
      notes,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.listing_id,
      NEW.user_id,
      COALESCE(OLD.stock_quantity, 0),
      NEW.stock_quantity,
      CASE
        WHEN NEW.stock_quantity < OLD.stock_quantity THEN 'sale'
        WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'restock'
        ELSE 'adjustment'
      END,
      'Automatic stock change',
      NEW.user_id
    );
    
    -- Update last stock update timestamp
    NEW.last_stock_update = NOW();
    
    -- Update last restock date if stock increased
    IF NEW.stock_quantity > COALESCE(OLD.stock_quantity, 0) THEN
      NEW.last_restock_date = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock change logging
CREATE TRIGGER trigger_log_stock_change
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION log_stock_change();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER trigger_storefronts_updated_at
BEFORE UPDATE ON storefronts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_seller_analytics_updated_at
BEFORE UPDATE ON seller_analytics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_inventory_items_updated_at
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_followers ENABLE ROW LEVEL SECURITY;

-- Storefronts policies
CREATE POLICY "Storefronts are viewable by everyone"
  ON storefronts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create their own storefront"
  ON storefronts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own storefront"
  ON storefronts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own storefront"
  ON storefronts FOR DELETE
  USING (auth.uid() = user_id);

-- Seller analytics policies
CREATE POLICY "Users can view their own analytics"
  ON seller_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON seller_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON seller_analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- Inventory items policies
CREATE POLICY "Users can view their own inventory"
  ON inventory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create inventory for their listings"
  ON inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON inventory_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory"
  ON inventory_items FOR DELETE
  USING (auth.uid() = user_id);

-- Stock history policies
CREATE POLICY "Users can view their own stock history"
  ON stock_history FOR SELECT
  USING (auth.uid() = user_id);

-- Storefront followers policies
CREATE POLICY "Anyone can view followers"
  ON storefront_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow storefronts"
  ON storefront_followers FOR INSERT
  WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can unfollow storefronts"
  ON storefront_followers FOR DELETE
  USING (auth.uid() = follower_user_id);

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON TABLE storefronts IS 'Custom branded seller pages with URLs, banners, themes, and featured products';
COMMENT ON TABLE seller_analytics IS 'Seller performance metrics with geographic and traffic source breakdowns';
COMMENT ON TABLE inventory_items IS 'Stock tracking and variant management for listings';
COMMENT ON TABLE stock_history IS 'Audit trail for all inventory changes';
COMMENT ON TABLE storefront_followers IS 'Users following seller storefronts';

COMMENT ON COLUMN storefronts.custom_url IS 'Unique URL slug for storefront (e.g., "johndoe")';
COMMENT ON COLUMN storefronts.featured_listings IS 'Array of up to 6 listing IDs to feature at top';
COMMENT ON COLUMN storefronts.custom_domain IS 'Custom domain for premium users';
COMMENT ON COLUMN seller_analytics.geographic_data IS 'Geographic breakdown of views by state/city';
COMMENT ON COLUMN seller_analytics.traffic_sources IS 'Traffic source breakdown (direct, search, social, referral)';
COMMENT ON COLUMN inventory_items.variants IS 'Product variants with separate stock counts';
COMMENT ON COLUMN inventory_items.is_sold_out IS 'Computed column: true when stock_quantity = 0';
