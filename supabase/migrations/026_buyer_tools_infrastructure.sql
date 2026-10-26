-- Migration: Buyer Tools Infrastructure
-- Description: Create purchase_records and meetups tables for buyer experience features

-- =====================================================
-- ENABLE REQUIRED EXTENSIONS
-- =====================================================
-- Enable cube extension (required for earthdistance)
CREATE EXTENSION IF NOT EXISTS cube;

-- Enable earthdistance extension for geographic calculations
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- =====================================================
-- PURCHASE RECORDS TABLE
-- =====================================================
-- Tracks all purchases made by buyers
CREATE TABLE IF NOT EXISTS purchase_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Purchase details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  
  -- Delivery tracking
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    delivery_status IN ('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'failed')
  ),
  delivery_address JSONB, -- {street, city, state, postal_code}
  tracking_number TEXT,
  
  -- Warranty information
  warranty_period_days INTEGER, -- Number of days warranty is valid
  warranty_expires_at TIMESTAMPTZ,
  warranty_terms TEXT,
  
  -- Transaction metadata
  payment_method TEXT, -- 'escrow', 'wallet', 'direct'
  escrow_transaction_id UUID REFERENCES escrow_transactions(id),
  
  -- Timestamps
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for purchase_records
CREATE INDEX idx_purchase_records_buyer_id ON purchase_records(buyer_id);
CREATE INDEX idx_purchase_records_seller_id ON purchase_records(seller_id);
CREATE INDEX idx_purchase_records_listing_id ON purchase_records(listing_id);
CREATE INDEX idx_purchase_records_purchased_at ON purchase_records(purchased_at DESC);
CREATE INDEX idx_purchase_records_delivery_status ON purchase_records(delivery_status);
CREATE INDEX idx_purchase_records_warranty_expires ON purchase_records(warranty_expires_at) WHERE warranty_expires_at IS NOT NULL;

-- =====================================================
-- MEETUPS TABLE
-- =====================================================
-- Tracks safe meetup locations for in-person transactions
CREATE TABLE IF NOT EXISTS meetups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES purchase_records(id) ON DELETE CASCADE,
  
  -- Participants
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Location details
  location_name TEXT NOT NULL, -- e.g., "Shoprite Ikeja"
  location_address TEXT NOT NULL,
  location_type TEXT CHECK (location_type IN ('mall', 'bank', 'police_station', 'public_place', 'other')),
  
  -- Coordinates
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Meetup scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0),
  
  -- Check-in status
  buyer_checked_in BOOLEAN DEFAULT FALSE,
  seller_checked_in BOOLEAN DEFAULT FALSE,
  buyer_checked_in_at TIMESTAMPTZ,
  seller_checked_in_at TIMESTAMPTZ,
  
  -- Meetup status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
  ),
  
  -- Safety features
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  safety_notes TEXT,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for meetups
CREATE INDEX idx_meetups_buyer_id ON meetups(buyer_id);
CREATE INDEX idx_meetups_seller_id ON meetups(seller_id);
CREATE INDEX idx_meetups_listing_id ON meetups(listing_id);
CREATE INDEX idx_meetups_transaction_id ON meetups(transaction_id);
CREATE INDEX idx_meetups_scheduled_at ON meetups(scheduled_at);
CREATE INDEX idx_meetups_status ON meetups(status);
CREATE INDEX idx_meetups_location ON meetups USING GIST (
  ll_to_earth(latitude::float8, longitude::float8)
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE purchase_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

-- Purchase Records Policies
-- Buyers can view their own purchases
CREATE POLICY "Users can view their own purchases"
  ON purchase_records FOR SELECT
  USING (auth.uid() = buyer_id);

-- Sellers can view purchases of their items
CREATE POLICY "Sellers can view purchases of their items"
  ON purchase_records FOR SELECT
  USING (auth.uid() = seller_id);

-- System can insert purchase records
CREATE POLICY "System can insert purchase records"
  ON purchase_records FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Buyers and sellers can update delivery status
CREATE POLICY "Buyers and sellers can update purchase records"
  ON purchase_records FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Meetups Policies
-- Participants can view their meetups
CREATE POLICY "Users can view their meetups"
  ON meetups FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Participants can create meetups
CREATE POLICY "Users can create meetups"
  ON meetups FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Participants can update their meetups
CREATE POLICY "Users can update their meetups"
  ON meetups FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Participants can delete their meetups
CREATE POLICY "Users can delete their meetups"
  ON meetups FOR DELETE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update purchase record updated_at timestamp
CREATE OR REPLACE FUNCTION update_purchase_record_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_records_updated_at
  BEFORE UPDATE ON purchase_records
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_record_updated_at();

-- Function to update meetup updated_at timestamp
CREATE OR REPLACE FUNCTION update_meetup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meetups_updated_at
  BEFORE UPDATE ON meetups
  FOR EACH ROW
  EXECUTE FUNCTION update_meetup_updated_at();

-- Function to check both parties checked in
CREATE OR REPLACE FUNCTION check_meetup_both_checked_in()
RETURNS TRIGGER AS $$
BEGIN
  -- If both parties have checked in, update status to in_progress
  IF NEW.buyer_checked_in = TRUE AND NEW.seller_checked_in = TRUE AND NEW.status = 'scheduled' THEN
    NEW.status = 'in_progress';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meetups_check_both_checked_in
  BEFORE UPDATE ON meetups
  FOR EACH ROW
  WHEN (NEW.buyer_checked_in IS DISTINCT FROM OLD.buyer_checked_in OR NEW.seller_checked_in IS DISTINCT FROM OLD.seller_checked_in)
  EXECUTE FUNCTION check_meetup_both_checked_in();

-- Function to set warranty expiration date
CREATE OR REPLACE FUNCTION set_warranty_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.warranty_period_days IS NOT NULL AND NEW.warranty_period_days > 0 THEN
    NEW.warranty_expires_at = NEW.purchased_at + (NEW.warranty_period_days || ' days')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_records_set_warranty_expiration
  BEFORE INSERT OR UPDATE ON purchase_records
  FOR EACH ROW
  WHEN (NEW.warranty_period_days IS NOT NULL)
  EXECUTE FUNCTION set_warranty_expiration();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE purchase_records IS 'Tracks all purchases made by buyers including delivery and warranty information';
COMMENT ON TABLE meetups IS 'Manages safe meetup locations and check-ins for in-person transactions';

COMMENT ON COLUMN purchase_records.warranty_period_days IS 'Number of days the warranty is valid from purchase date';
COMMENT ON COLUMN purchase_records.warranty_expires_at IS 'Automatically calculated expiration date for warranty';
COMMENT ON COLUMN meetups.location_type IS 'Type of meetup location for safety categorization';
COMMENT ON COLUMN meetups.buyer_checked_in IS 'Whether buyer has checked in at the meetup location';
COMMENT ON COLUMN meetups.seller_checked_in IS 'Whether seller has checked in at the meetup location';
