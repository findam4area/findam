-- Migration 056: RLS Policies for Categories
-- Date: 2025-01-23
-- Purpose: Public read access for categories, admin write access

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view all categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Policy 1: Public can view all categories
CREATE POLICY "Public can view all categories"
  ON categories
  FOR SELECT
  USING (true);

-- Policy 2: Service role (admin) can manage categories
CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  USING (
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.role() = 'service_role'
  );

-- Note: If you have a profiles table with admin role, add:
-- CREATE POLICY "Profile admins can manage categories"
--   ON categories
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--         AND profiles.role = 'admin'
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--         AND profiles.role = 'admin'
--     )
--   );

COMMENT ON POLICY "Public can view all categories" ON categories IS 
  'Allow anyone (authenticated or anonymous) to read all categories';

COMMENT ON POLICY "Admins can manage categories" ON categories IS 
  'Allow service_role to create, update, and delete categories';
