-- Migration: Add GDPR deletion fields to profiles table
-- Requirements: 31.8 (GDPR Right to be Forgotten)
-- Date: 2024

-- Add deletion scheduling fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active' 
  CHECK (status IN ('active', 'deletion_scheduled', 'deleted', 'suspended'));

-- Create index for deletion scheduled profiles
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled 
ON profiles(deletion_scheduled_at) 
WHERE deletion_scheduled_at IS NOT NULL;

-- Create index for profile status
CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON profiles(status);

-- Add comment for documentation
COMMENT ON COLUMN profiles.deletion_scheduled_at IS 'Timestamp when account deletion is scheduled (30-day grace period)';
COMMENT ON COLUMN profiles.status IS 'Account status: active, deletion_scheduled, deleted, suspended';
