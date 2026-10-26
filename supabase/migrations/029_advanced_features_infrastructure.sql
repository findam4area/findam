-- Migration: Advanced Features Infrastructure
-- Description: Creates tables for smart pricing suggestions

-- =====================================================
-- PRICING SUGGESTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Suggested pricing
  suggested_price DECIMAL(10, 2) NOT NULL,
  min_price DECIMAL(10, 2) NOT NULL,
  max_price DECIMAL(10, 2) NOT NULL,
  confidence_score DECIMAL(5, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Market analysis
  market_average DECIMAL(10, 2),
  similar_items_count INTEGER DEFAULT 0,
  avg_selling_time_days INTEGER,
  
  -- Factors considered
  factors_considered JSONB DEFAULT '{}',
  -- Example: {"condition": "new", "brand": "Samsung", "age_months": 6, "location": "Lagos"}
  
  -- Seasonal analysis
  seasonal_adjustment DECIMAL(5, 2) DEFAULT 0,
  -- Percentage adjustment based on season (+/- percentage)
  
  -- Price history
  price_history JSONB DEFAULT '[]',
  -- Array of {date, avg_price, min_price, max_price}
  
  -- Performance tracking
  suggestion_accepted BOOLEAN DEFAULT FALSE,
  actual_price_set DECIMAL(10, 2),
  price_deviation_percentage DECIMAL(5, 2),
  -- Percentage difference between suggested and actual price
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT pricing_suggestions_listing_id_key UNIQUE(listing_id)
);

-- Create indexes for performance
CREATE INDEX idx_pricing_suggestions_user_id ON pricing_suggestions(user_id);
CREATE INDEX idx_pricing_suggestions_listing_id ON pricing_suggestions(listing_id);
CREATE INDEX idx_pricing_suggestions_created_at ON pricing_suggestions(created_at DESC);
CREATE INDEX idx_pricing_suggestions_confidence ON pricing_suggestions(confidence_score DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE pricing_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own pricing suggestions
CREATE POLICY "Users can view own pricing suggestions"
  ON pricing_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own pricing suggestions
CREATE POLICY "Users can create own pricing suggestions"
  ON pricing_suggestions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pricing suggestions
CREATE POLICY "Users can update own pricing suggestions"
  ON pricing_suggestions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pricing suggestions
CREATE POLICY "Users can delete own pricing suggestions"
  ON pricing_suggestions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all pricing suggestions
CREATE POLICY "Service role can manage all pricing suggestions"
  ON pricing_suggestions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE TRIGGER update_pricing_suggestions_updated_at
  BEFORE UPDATE ON pricing_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Calculate price deviation when actual price is set
CREATE OR REPLACE FUNCTION calculate_price_deviation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_price_set IS NOT NULL AND NEW.suggested_price IS NOT NULL THEN
    NEW.price_deviation_percentage := 
      ((NEW.actual_price_set - NEW.suggested_price) / NEW.suggested_price) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_price_deviation_trigger
  BEFORE INSERT OR UPDATE ON pricing_suggestions
  FOR EACH ROW
  WHEN (NEW.actual_price_set IS NOT NULL)
  EXECUTE FUNCTION calculate_price_deviation();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get pricing suggestion for a listing
CREATE OR REPLACE FUNCTION get_pricing_suggestion(p_listing_id UUID)
RETURNS TABLE (
  id UUID,
  suggested_price DECIMAL,
  min_price DECIMAL,
  max_price DECIMAL,
  confidence_score DECIMAL,
  market_average DECIMAL,
  similar_items_count INTEGER,
  avg_selling_time_days INTEGER,
  seasonal_adjustment DECIMAL,
  price_history JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.suggested_price,
    ps.min_price,
    ps.max_price,
    ps.confidence_score,
    ps.market_average,
    ps.similar_items_count,
    ps.avg_selling_time_days,
    ps.seasonal_adjustment,
    ps.price_history
  FROM pricing_suggestions ps
  WHERE ps.listing_id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept pricing suggestion
CREATE OR REPLACE FUNCTION accept_pricing_suggestion(
  p_suggestion_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_listing_id UUID;
  v_suggested_price DECIMAL;
BEGIN
  -- Get suggestion details
  SELECT listing_id, suggested_price
  INTO v_listing_id, v_suggested_price
  FROM pricing_suggestions
  WHERE id = p_suggestion_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update listing price
  UPDATE listings
  SET price = v_suggested_price
  WHERE id = v_listing_id AND user_id = p_user_id;
  
  -- Mark suggestion as accepted
  UPDATE pricing_suggestions
  SET 
    suggestion_accepted = TRUE,
    actual_price_set = v_suggested_price,
    updated_at = NOW()
  WHERE id = p_suggestion_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE pricing_suggestions IS 'Stores AI-powered pricing suggestions for listings based on market analysis';
COMMENT ON COLUMN pricing_suggestions.confidence_score IS 'Confidence level of the suggestion (0-100%)';
COMMENT ON COLUMN pricing_suggestions.factors_considered IS 'JSON object containing factors used in pricing calculation';
COMMENT ON COLUMN pricing_suggestions.seasonal_adjustment IS 'Percentage adjustment based on seasonal trends';
COMMENT ON COLUMN pricing_suggestions.price_history IS 'Historical price data for similar items';
COMMENT ON COLUMN pricing_suggestions.price_deviation_percentage IS 'Percentage difference between suggested and actual price set by user';
