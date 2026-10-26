-- Migration 057: RLS Policies for Listings (CORRECTED)
-- Date: 2025-01-23
-- Purpose: Marketplace listing policies - public read of approved active listings, owner write

-- ============================================================
-- PART 1: Main Listings Table
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view approved listings" ON listings;
DROP POLICY IF EXISTS "Users can view own listings" ON listings;
DROP POLICY IF EXISTS "Users can create listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;

-- Policy 1: Public can view approved and active listings
CREATE POLICY "Public can view approved listings"
  ON listings
  FOR SELECT
  USING (status = 'approved' AND is_active = true);

-- Policy 2: Users can view their own listings (any status)
CREATE POLICY "Users can view own listings"
  ON listings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 3: Authenticated users can create listings
CREATE POLICY "Users can create listings"
  ON listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own listings
CREATE POLICY "Users can update own listings"
  ON listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- PART 2: Product Listings Table
-- ============================================================

DROP POLICY IF EXISTS "Public can view active products" ON product_listings;
DROP POLICY IF EXISTS "Business owners can manage products" ON product_listings;

-- Public read of active products
CREATE POLICY "Public can view active products"
  ON product_listings
  FOR SELECT
  USING (is_active = true);

-- Business owners can manage their products
CREATE POLICY "Business owners can manage products"
  ON product_listings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.id = product_listings.business_profile_id
      AND bp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.id = product_listings.business_profile_id
      AND bp.user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 3: Service Listings Table
-- ============================================================

DROP POLICY IF EXISTS "Public can view active services" ON service_listings;
DROP POLICY IF EXISTS "Business owners can manage services" ON service_listings;

-- Public read of active services
CREATE POLICY "Public can view active services"
  ON service_listings
  FOR SELECT
  USING (is_active = true);

-- Business owners can manage their services
CREATE POLICY "Business owners can manage services"
  ON service_listings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.id = service_listings.business_profile_id
      AND bp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.id = service_listings.business_profile_id
      AND bp.user_id = auth.uid()
    )
  );

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON POLICY "Public can view approved listings" ON listings IS 
  'Allow anyone to view approved and active listings only';

COMMENT ON POLICY "Users can view own listings" ON listings IS 
  'Allow users to view all their own listings regardless of status';

COMMENT ON POLICY "Users can create listings" ON listings IS 
  'Allow authenticated users to create their own listings';

COMMENT ON POLICY "Users can update own listings" ON listings IS 
  'Allow users to update only their own listings';

COMMENT ON POLICY "Users can delete own listings" ON listings IS 
  'Allow users to delete only their own listings';

COMMENT ON POLICY "Public can view active products" ON product_listings IS 
  'Allow anyone to view active product listings';

COMMENT ON POLICY "Business owners can manage products" ON product_listings IS 
  'Allow business owners full control over their product listings';

COMMENT ON POLICY "Public can view active services" ON service_listings IS 
  'Allow anyone to view active service listings';

COMMENT ON POLICY "Business owners can manage services" ON service_listings IS 
  'Allow business owners full control over their service listings';