-- =====================================================
-- Migration: Marketplace RLS Policies Enhancement
-- Task: 1.5 Implement Row Level Security (RLS) policies
-- Requirements: 15.2
-- =====================================================

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on vendor tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_applications') THEN
    ALTER TABLE vendor_applications ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approved_vendors') THEN
    ALTER TABLE approved_vendors ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- DROP EXISTING POLICIES TO RECREATE THEM
-- =====================================================

-- Drop users policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Drop categories policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "categories_select_all" ON categories;

-- Drop listings policies
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON listings;
DROP POLICY IF EXISTS "Users can create own listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
DROP POLICY IF EXISTS "listings_select_public" ON listings;
DROP POLICY IF EXISTS "listings_select_own" ON listings;
DROP POLICY IF EXISTS "listings_select_public_approved" ON listings;
DROP POLICY IF EXISTS "listings_insert_own" ON listings;
DROP POLICY IF EXISTS "listings_update_own" ON listings;
DROP POLICY IF EXISTS "listings_update_own_or_admin" ON listings;
DROP POLICY IF EXISTS "listings_delete_own" ON listings;

-- Drop vendor application policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_applications') THEN
    DROP POLICY IF EXISTS "vendor_applications_select_own_or_admin" ON vendor_applications;
    DROP POLICY IF EXISTS "vendor_applications_insert_own" ON vendor_applications;
    DROP POLICY IF EXISTS "vendor_applications_update_admin_only" ON vendor_applications;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approved_vendors') THEN
    DROP POLICY IF EXISTS "approved_vendors_select_all" ON approved_vendors;
    DROP POLICY IF EXISTS "approved_vendors_insert_admin_only" ON approved_vendors;
    DROP POLICY IF EXISTS "approved_vendors_update_admin_only" ON approved_vendors;
    DROP POLICY IF EXISTS "approved_vendors_delete_admin_only" ON approved_vendors;
  END IF;
END $$;

-- =====================================================
-- CREATE UPDATED RLS POLICIES
-- =====================================================

-- =====================================================
-- USERS TABLE POLICIES
-- Requirement: public read, users update own profile
-- =====================================================

CREATE POLICY "users_select_all"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

COMMENT ON POLICY "users_select_all" ON users IS 
  'Public read: Anyone can view user profiles';

COMMENT ON POLICY "users_update_own" ON users IS 
  'Users can update their own profile only';

-- =====================================================
-- CATEGORIES TABLE POLICIES
-- Requirement: public read
-- =====================================================

CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  USING (true);

COMMENT ON POLICY "categories_select_all" ON categories IS 
  'Public read: Anyone can view categories';

-- =====================================================
-- LISTINGS TABLE POLICIES
-- Requirement: public see approved, users see own, admins see all
-- =====================================================

CREATE POLICY "listings_select_public_approved"
  ON listings FOR SELECT
  USING (
    status = 'approved' 
    OR user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "listings_insert_own"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listings_update_own_or_admin"
  ON listings FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "listings_delete_own"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "listings_select_public_approved" ON listings IS 
  'Public see approved listings; users see their own; admins see all';

COMMENT ON POLICY "listings_update_own_or_admin" ON listings IS 
  'Users can update own listings; admins can update any listing for approval workflow';

-- =====================================================
-- VENDOR_APPLICATIONS TABLE POLICIES
-- Requirement: users see own, admins see all
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_applications') THEN
    EXECUTE 'CREATE POLICY "vendor_applications_select_own_or_admin"
      ON vendor_applications FOR SELECT
      USING (
        auth.uid() = user_id 
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = ''admin''
        )
      )';
    
    EXECUTE 'CREATE POLICY "vendor_applications_insert_own"
      ON vendor_applications FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "vendor_applications_update_admin_only"
      ON vendor_applications FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = ''admin''
        )
      )';
  END IF;
END $$;

-- =====================================================
-- APPROVED_VENDORS TABLE POLICIES
-- Requirement: public read
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approved_vendors') THEN
    EXECUTE 'CREATE POLICY "approved_vendors_select_all"
      ON approved_vendors FOR SELECT
      USING (true)';
    
    EXECUTE 'CREATE POLICY "approved_vendors_insert_admin_only"
      ON approved_vendors FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = ''admin''
        )
      )';
    
    EXECUTE 'CREATE POLICY "approved_vendors_update_admin_only"
      ON approved_vendors FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = ''admin''
        )
      )';
    
    EXECUTE 'CREATE POLICY "approved_vendors_delete_admin_only"
      ON approved_vendors FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = ''admin''
        )
      )';
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION is_admin IS 
  'Helper function to check if a user has admin role';

-- =====================================================
-- FUNCTION: Update vendor application status
-- =====================================================

CREATE OR REPLACE FUNCTION update_vendor_application_status(
  application_id UUID,
  new_status TEXT,
  admin_user_id UUID,
  rejection_reason_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_business_name TEXT;
BEGIN
  -- Verify admin role
  IF NOT is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Only admins can update vendor application status';
  END IF;

  -- Verify status is valid
  IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  -- Get application details
  SELECT user_id, business_name INTO v_user_id, v_business_name
  FROM vendor_applications
  WHERE id = application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor application not found';
  END IF;

  -- Update application
  UPDATE vendor_applications
  SET 
    status = new_status,
    rejection_reason = rejection_reason_text,
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = application_id;

  -- If approved, create approved vendor record
  IF new_status = 'approved' THEN
    INSERT INTO approved_vendors (user_id, business_name)
    VALUES (v_user_id, v_business_name)
    ON CONFLICT (user_id) DO UPDATE
    SET 
      business_name = EXCLUDED.business_name,
      approved_badge_enabled = TRUE;
  END IF;

  -- If rejected and was previously approved, remove approved vendor
  IF new_status = 'rejected' THEN
    DELETE FROM approved_vendors WHERE user_id = v_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION update_vendor_application_status IS 
  'Admin function to approve or reject vendor applications';

-- =====================================================
-- FUNCTION: Update listing approval status
-- =====================================================

CREATE OR REPLACE FUNCTION update_listing_status(
  listing_id UUID,
  new_status TEXT,
  admin_user_id UUID,
  rejection_reason_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin role
  IF NOT is_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Only admins can update listing status';
  END IF;

  -- Verify status is valid
  IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  -- Update listing
  UPDATE listings
  SET 
    status = new_status,
    rejection_reason = rejection_reason_text,
    updated_at = NOW()
  WHERE id = listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION update_listing_status IS 
  'Admin function to approve or reject listings';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on admin functions to authenticated users
-- (The functions check admin role internally via SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION update_vendor_application_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_listing_status TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 049_marketplace_rls_policies.sql completed successfully';
  RAISE NOTICE 'Updated RLS policies for users, categories, listings, vendor_applications, approved_vendors';
  RAISE NOTICE 'Created admin helper functions';
END $$;