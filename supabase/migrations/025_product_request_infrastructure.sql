-- Migration: Product Request Infrastructure

-- =====================================================
-- 1. PRODUCT_REQUESTS TABLE 
-- =====================================================
-- Store buyer requests for products they're looking for

CREATE TABLE IF NOT EXISTS product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request details (Req 19.1)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Budget range (Req 19.1)
  budget_min DECIMAL(12,2) CHECK (budget_min >= 0),
  budget_max DECIMAL(12,2) CHECK (budget_max >= 0),
  
  -- Location preference (Req 19.9)
  preferred_location TEXT,
  
  -- Status tracking (Req 19.6, 19.7, 19.8)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
  
  -- Offer tracking (Req 19.10)
  offers_count INTEGER DEFAULT 0 CHECK (offers_count >= 0),
  
  -- Expiration (Req 19.6)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  fulfilled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT description_not_empty CHECK (length(trim(description)) > 0),
  CONSTRAINT budget_range_valid CHECK (
    (budget_min IS NULL AND budget_max IS NULL) OR
    (budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_max >= budget_min)
  ),
  CONSTRAINT fulfilled_at_requires_fulfilled_status CHECK (
    (status = 'fulfilled' AND fulfilled_at IS NOT NULL) OR
    (status != 'fulfilled' AND fulfilled_at IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_product_requests_user_id ON product_requests(user_id);
CREATE INDEX idx_product_requests_category_id ON product_requests(category_id);
CREATE INDEX idx_product_requests_status ON product_requests(status);
CREATE INDEX idx_product_requests_expires_at ON product_requests(expires_at);
CREATE INDEX idx_product_requests_created_at ON product_requests(created_at DESC);
CREATE INDEX idx_product_requests_active ON product_requests(status, expires_at) WHERE status = 'active';
CREATE INDEX idx_product_requests_location ON product_requests(preferred_location) WHERE preferred_location IS NOT NULL;
CREATE INDEX idx_product_requests_budget ON product_requests(budget_min, budget_max) WHERE budget_min IS NOT NULL;
CREATE INDEX idx_product_requests_search ON product_requests USING GIN(to_tsvector('english', title || ' ' || description));

-- Composite indexes for common queries
CREATE INDEX idx_product_requests_active_category ON product_requests(category_id, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_product_requests_user_status ON product_requests(user_id, status, created_at DESC);

-- =====================================================
-- 2. REQUEST_OFFERS TABLE (Task 43.2)
-- =====================================================
-- Store seller offers for product requests

CREATE TABLE IF NOT EXISTS request_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES product_requests(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Offer details (Req 19.3)
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  message TEXT,
  
  -- Offer status (Req 19.5)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT price_positive CHECK (price >= 0),
  CONSTRAINT no_duplicate_offers UNIQUE(request_id, seller_id, listing_id)
  -- Note: seller_not_requester constraint enforced via RLS policy instead of CHECK constraint
);

-- Indexes for performance
CREATE INDEX idx_request_offers_request_id ON request_offers(request_id);
CREATE INDEX idx_request_offers_seller_id ON request_offers(seller_id);
CREATE INDEX idx_request_offers_listing_id ON request_offers(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX idx_request_offers_status ON request_offers(status);
CREATE INDEX idx_request_offers_created_at ON request_offers(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_request_offers_request_status ON request_offers(request_id, status, created_at DESC);
CREATE INDEX idx_request_offers_seller_status ON request_offers(seller_id, status, created_at DESC);
CREATE INDEX idx_request_offers_pending ON request_offers(request_id, created_at DESC) WHERE status = 'pending';

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product_requests updated_at
CREATE TRIGGER trigger_product_requests_updated_at
BEFORE UPDATE ON product_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for request_offers updated_at
CREATE TRIGGER trigger_request_offers_updated_at
BEFORE UPDATE ON request_offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to increment request offers count
CREATE OR REPLACE FUNCTION increment_request_offers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_requests
  SET 
    offers_count = offers_count + 1,
    updated_at = NOW()
  WHERE id = NEW.request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment offers_count when offer created
CREATE TRIGGER trigger_increment_request_offers_count
AFTER INSERT ON request_offers
FOR EACH ROW
EXECUTE FUNCTION increment_request_offers_count();

-- Function to decrement request offers count
CREATE OR REPLACE FUNCTION decrement_request_offers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_requests
  SET 
    offers_count = GREATEST(0, offers_count - 1),
    updated_at = NOW()
  WHERE id = OLD.request_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-decrement offers_count when offer deleted
CREATE TRIGGER trigger_decrement_request_offers_count
AFTER DELETE ON request_offers
FOR EACH ROW
EXECUTE FUNCTION decrement_request_offers_count();

-- Function to expire old requests (Req 19.6)
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
BEGIN
  UPDATE product_requests
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to mark request as fulfilled (Req 19.7)
CREATE OR REPLACE FUNCTION mark_request_fulfilled(p_request_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE product_requests
  SET 
    status = 'fulfilled',
    fulfilled_at = NOW(),
    updated_at = NOW()
  WHERE 
    id = p_request_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to get active requests count for a user
CREATE OR REPLACE FUNCTION get_user_active_requests_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO request_count
  FROM product_requests
  WHERE user_id = p_user_id AND status = 'active';
  
  RETURN request_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get request statistics
CREATE OR REPLACE FUNCTION get_request_statistics(p_request_id UUID)
RETURNS TABLE(
  total_offers INTEGER,
  pending_offers INTEGER,
  accepted_offers INTEGER,
  rejected_offers INTEGER,
  avg_offer_price DECIMAL(12,2),
  min_offer_price DECIMAL(12,2),
  max_offer_price DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_offers,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_offers,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as accepted_offers,
    COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER as rejected_offers,
    AVG(price)::DECIMAL(12,2) as avg_offer_price,
    MIN(price)::DECIMAL(12,2) as min_offer_price,
    MAX(price)::DECIMAL(12,2) as max_offer_price
  FROM request_offers
  WHERE request_id = p_request_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. VIEWS
-- =====================================================

-- View for active product requests (Req 19.2, 19.8)
CREATE OR REPLACE VIEW active_product_requests AS
SELECT 
  pr.*,
  u.username as requester_username,
  u.avatar_url as requester_avatar,
  u.trust_score as requester_trust_score,
  c.name as category_name,
  (pr.expires_at - NOW()) as time_remaining
FROM product_requests pr
JOIN users u ON pr.user_id = u.id
LEFT JOIN categories c ON pr.category_id = c.id
WHERE pr.status = 'active' AND pr.expires_at > NOW()
ORDER BY pr.created_at DESC;

-- View for request offers with details (Req 19.5)
CREATE OR REPLACE VIEW request_offers_with_details AS
SELECT 
  ro.*,
  pr.title as request_title,
  pr.user_id as requester_id,
  pr.status as request_status,
  seller.username as seller_username,
  seller.avatar_url as seller_avatar,
  seller.trust_score as seller_trust_score,
  seller.phone_verified as seller_phone_verified,
  seller.nin_verified as seller_nin_verified,
  l.title as listing_title,
  l.thumbnail_url as listing_thumbnail,
  l.condition as listing_condition,
  l.state as listing_state,
  l.lga as listing_lga
FROM request_offers ro
JOIN product_requests pr ON ro.request_id = pr.id
JOIN users seller ON ro.seller_id = seller.id
LEFT JOIN listings l ON ro.listing_id = l.id
ORDER BY ro.created_at DESC;

-- View for user's requests with statistics
CREATE OR REPLACE VIEW user_requests_summary AS
SELECT 
  pr.*,
  c.name as category_name,
  (pr.expires_at - NOW()) as time_remaining,
  COALESCE(stats.total_offers, 0) as total_offers,
  COALESCE(stats.pending_offers, 0) as pending_offers,
  COALESCE(stats.accepted_offers, 0) as accepted_offers,
  COALESCE(stats.avg_offer_price, 0) as avg_offer_price,
  COALESCE(stats.min_offer_price, 0) as min_offer_price,
  COALESCE(stats.max_offer_price, 0) as max_offer_price
FROM product_requests pr
LEFT JOIN categories c ON pr.category_id = c.id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*)::INTEGER as total_offers,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_offers,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as accepted_offers,
    AVG(price)::DECIMAL(12,2) as avg_offer_price,
    MIN(price)::DECIMAL(12,2) as min_offer_price,
    MAX(price)::DECIMAL(12,2) as max_offer_price
  FROM request_offers
  WHERE request_id = pr.id
) stats ON true
ORDER BY pr.created_at DESC;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_offers ENABLE ROW LEVEL SECURITY;

-- Product requests policies

-- Anyone can view active product requests (Req 19.2)
CREATE POLICY "Anyone can view active product requests"
  ON product_requests FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

-- Users can view all their own requests regardless of status
CREATE POLICY "Users can view their own requests"
  ON product_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own product requests (Req 19.1)
CREATE POLICY "Users can create their own requests"
  ON product_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own product requests
CREATE POLICY "Users can update their own requests"
  ON product_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own product requests
CREATE POLICY "Users can delete their own requests"
  ON product_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Request offers policies

-- Sellers can create offers for any active request (Req 19.3)
CREATE POLICY "Sellers can create offers for active requests"
  ON request_offers FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id
    AND EXISTS (
      SELECT 1 FROM product_requests
      WHERE id = request_id
      AND status = 'active'
      AND expires_at > NOW()
      AND user_id != auth.uid() -- Prevent self-offers
    )
  );

-- Requesters can view all offers for their requests (Req 19.5)
CREATE POLICY "Requesters can view offers for their requests"
  ON request_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_requests
      WHERE id = request_id
      AND user_id = auth.uid()
    )
  );

-- Sellers can view their own offers
CREATE POLICY "Sellers can view their own offers"
  ON request_offers FOR SELECT
  USING (auth.uid() = seller_id);

-- Requesters can update offer status (accept/reject)
CREATE POLICY "Requesters can update offer status"
  ON request_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_requests
      WHERE id = request_id
      AND user_id = auth.uid()
    )
  );

-- Sellers can update their own offers (edit message/price)
CREATE POLICY "Sellers can update their own offers"
  ON request_offers FOR UPDATE
  USING (auth.uid() = seller_id);

-- Sellers can delete their own offers
CREATE POLICY "Sellers can delete their own offers"
  ON request_offers FOR DELETE
  USING (auth.uid() = seller_id);

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE product_requests IS 'Buyer requests for products they are looking for (Requirement 19)';
COMMENT ON TABLE request_offers IS 'Seller offers in response to product requests (Requirement 19)';

COMMENT ON COLUMN product_requests.title IS 'Short title describing what the buyer is looking for';
COMMENT ON COLUMN product_requests.description IS 'Detailed description of the product request';
COMMENT ON COLUMN product_requests.budget_min IS 'Minimum budget in NGN (optional)';
COMMENT ON COLUMN product_requests.budget_max IS 'Maximum budget in NGN (optional)';
COMMENT ON COLUMN product_requests.preferred_location IS 'Preferred location for pickup or delivery';
COMMENT ON COLUMN product_requests.status IS 'Request status: active, fulfilled, or expired';
COMMENT ON COLUMN product_requests.offers_count IS 'Number of offers received (auto-incremented)';
COMMENT ON COLUMN product_requests.expires_at IS 'Automatic expiration date (30 days from creation)';
COMMENT ON COLUMN product_requests.fulfilled_at IS 'Timestamp when request was marked as fulfilled';

COMMENT ON COLUMN request_offers.request_id IS 'Reference to the product request';
COMMENT ON COLUMN request_offers.seller_id IS 'User ID of the seller making the offer';
COMMENT ON COLUMN request_offers.listing_id IS 'Optional reference to an existing listing';
COMMENT ON COLUMN request_offers.price IS 'Offered price in NGN';
COMMENT ON COLUMN request_offers.message IS 'Optional message from seller to requester';
COMMENT ON COLUMN request_offers.status IS 'Offer status: pending, accepted, or rejected';

COMMENT ON VIEW active_product_requests IS 'All active, non-expired product requests with requester details';
COMMENT ON VIEW request_offers_with_details IS 'Request offers with full seller and listing details for comparison';
COMMENT ON VIEW user_requests_summary IS 'User requests with aggregated offer statistics';

COMMENT ON FUNCTION expire_old_requests() IS 'Cron job function: Mark requests as expired after 30 days. Schedule to run daily.';
COMMENT ON FUNCTION mark_request_fulfilled(UUID) IS 'Mark a product request as fulfilled by the requester';
COMMENT ON FUNCTION get_request_statistics(UUID) IS 'Get aggregated statistics for offers on a specific request';

-- =====================================================
-- 7. GRANTS
-- =====================================================

-- Grant necessary permissions for background jobs and service role
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Grant SELECT on views to authenticated users
GRANT SELECT ON active_product_requests TO authenticated;
GRANT SELECT ON request_offers_with_details TO authenticated;
GRANT SELECT ON user_requests_summary TO authenticated;

-- =====================================================
-- 8. INITIAL SETUP NOTES
-- =====================================================

-- CRON JOB SETUP:
-- Schedule the expire_old_requests() function to run daily
-- Example using pg_cron extension:
-- SELECT cron.schedule('expire-old-product-requests', '0 0 * * *', 'SELECT expire_old_requests()');

-- NOTIFICATION TRIGGERS:
-- Consider adding triggers to create notifications when:
-- 1. A new offer is submitted (notify requester) - Req 19.4
-- 2. An offer is accepted/rejected (notify seller)
-- 3. A request is about to expire (notify requester 24h before)

-- TYPESENSE INDEXING:
-- Index product_requests table for fast search with typo tolerance
-- Include fields: title, description, category_name, preferred_location, budget_min, budget_max

-- ANALYTICS TRACKING:
-- Track metrics: request creation rate, offer submission rate, fulfillment rate, average time to fulfill
