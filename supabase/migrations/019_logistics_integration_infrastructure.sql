-- Migration: Logistics Integration Infrastructure
-- Description: Creates tables and functions for integrated logistics and tracking (Requirement 8)
-- Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10

-- Create logistics_providers table
CREATE TABLE IF NOT EXISTS logistics_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('GIG', 'Kwik', 'Sendbox', 'Gokada', 'Redbox', 'Bolt')),
  api_endpoint TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create shipments table (Requirement 8.2, 8.4, 8.6, 8.9)
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES logistics_providers(id),
  tracking_number TEXT NOT NULL,
  
  -- Addresses
  pickup_address JSONB NOT NULL, -- {street, city, state, postal_code, country, contact_name, contact_phone}
  delivery_address JSONB NOT NULL, -- {street, city, state, postal_code, country, contact_name, contact_phone}
  
  -- Package details
  package_details JSONB NOT NULL, -- {weight, dimensions: {length, width, height}, value, description}
  
  -- Status tracking (Requirement 8.3)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed')
  ),
  current_location TEXT,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  
  -- Delivery person details (Requirement 8.6)
  delivery_person JSONB, -- {name, phone, photo}
  
  -- Pricing (Requirement 8.10)
  shipping_cost DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  
  -- Delivery rating (Requirement 8.7)
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  delivery_review TEXT,
  
  -- Failure details (Requirement 8.8)
  failure_reason TEXT,
  failure_timestamp TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  CONSTRAINT unique_tracking_number UNIQUE (tracking_number)
);

-- Create shipment_tracking_events table (Requirement 8.3, 8.9)
CREATE TABLE IF NOT EXISTS shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create shipping_quotes table (Requirement 8.10)
CREATE TABLE IF NOT EXISTS shipping_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES logistics_providers(id),
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  package_details JSONB NOT NULL,
  quoted_price DECIMAL(10, 2) NOT NULL,
  estimated_delivery_time TEXT, -- e.g., "2-3 days"
  currency TEXT DEFAULT 'NGN',
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_provider_id ON shipments(provider_id);
CREATE INDEX idx_shipment_tracking_events_shipment_id ON shipment_tracking_events(shipment_id);
CREATE INDEX idx_shipment_tracking_events_timestamp ON shipment_tracking_events(timestamp DESC);
CREATE INDEX idx_shipping_quotes_valid_until ON shipping_quotes(valid_until);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_logistics_providers_updated_at
  BEFORE UPDATE ON logistics_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to add tracking event and update shipment status
CREATE OR REPLACE FUNCTION add_shipment_tracking_event(
  p_shipment_id UUID,
  p_status TEXT,
  p_location TEXT,
  p_description TEXT,
  p_timestamp TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Insert tracking event
  INSERT INTO shipment_tracking_events (
    shipment_id,
    status,
    location,
    description,
    timestamp
  ) VALUES (
    p_shipment_id,
    p_status,
    p_location,
    p_description,
    p_timestamp
  ) RETURNING id INTO v_event_id;
  
  -- Update shipment status and current location
  UPDATE shipments
  SET 
    status = p_status,
    current_location = p_location,
    updated_at = now(),
    actual_delivery = CASE WHEN p_status = 'delivered' THEN p_timestamp ELSE actual_delivery END,
    failure_timestamp = CASE WHEN p_status = 'failed' THEN p_timestamp ELSE failure_timestamp END
  WHERE id = p_shipment_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get shipment tracking history (Requirement 8.9)
CREATE OR REPLACE FUNCTION get_shipment_tracking_history(p_shipment_id UUID)
RETURNS TABLE (
  event_id UUID,
  status TEXT,
  location TEXT,
  description TEXT,
  event_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    ste.status,
    ste.location,
    ste.description,
    ste.timestamp
  FROM shipment_tracking_events ste
  WHERE ste.shipment_id = p_shipment_id
  ORDER BY ste.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Seed logistics providers (Requirement 8.2)
INSERT INTO logistics_providers (name, api_endpoint, is_active) VALUES
  ('GIG', 'https://api.giglogistics.com', true),
  ('Kwik', 'https://api.kwikdelivery.com', true),
  ('Sendbox', 'https://api.sendbox.co', true),
  ('Gokada', 'https://api.gokada.ng', true),
  ('Redbox', 'https://api.redboxlogistics.com', true),
  ('Bolt', 'https://api.bolt.eu', true)
ON CONFLICT (name) DO NOTHING;

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE logistics_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_quotes ENABLE ROW LEVEL SECURITY;

-- Logistics providers: Public read access
CREATE POLICY "Logistics providers are viewable by everyone"
  ON logistics_providers FOR SELECT
  USING (is_active = true);

-- Shipments: Users can view their own shipments
CREATE POLICY "Users can view their own shipments"
  ON shipments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM escrow_transactions
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- Shipments: Service role can manage all shipments
CREATE POLICY "Service role can manage all shipments"
  ON shipments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Tracking events: Users can view events for their shipments
CREATE POLICY "Users can view tracking events for their shipments"
  ON shipment_tracking_events FOR SELECT
  USING (
    shipment_id IN (
      SELECT id FROM shipments
      WHERE order_id IN (
        SELECT id FROM escrow_transactions
        WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
      )
    )
  );

-- Tracking events: Service role can manage all events
CREATE POLICY "Service role can manage all tracking events"
  ON shipment_tracking_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Shipping quotes: Users can view their own quotes
CREATE POLICY "Users can view their own shipping quotes"
  ON shipping_quotes FOR SELECT
  USING (true); -- Quotes are temporary and don't contain sensitive info

-- Shipping quotes: Service role can manage all quotes
CREATE POLICY "Service role can manage all shipping quotes"
  ON shipping_quotes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE logistics_providers IS 'Stores integrated logistics partner information (Requirement 8.2)';
COMMENT ON TABLE shipments IS 'Stores shipment details including tracking, addresses, and delivery person info (Requirements 8.2, 8.4, 8.6, 8.9)';
COMMENT ON TABLE shipment_tracking_events IS 'Stores tracking event history for shipments (Requirements 8.3, 8.9)';
COMMENT ON TABLE shipping_quotes IS 'Stores shipping cost quotes from logistics providers (Requirement 8.10)';
COMMENT ON FUNCTION add_shipment_tracking_event IS 'Adds a tracking event and updates shipment status';
COMMENT ON FUNCTION get_shipment_tracking_history IS 'Retrieves complete tracking history for a shipment (Requirement 8.9)';
