-- Migration: Claimable Business Listings System
-- Task 20.5: Implement claimable business listings
-- Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6

-- ============================================================================
-- BUSINESS CLAIM REQUESTS TABLE
-- ============================================================================
-- Stores business ownership claim requests with verification workflow
CREATE TABLE IF NOT EXISTS business_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  claimant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Claim status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'expired')),
  
  -- Verification methods used
  verification_methods TEXT[] DEFAULT '{}', -- ['business_registration', 'tax_id', 'domain_verification']
  
  -- Document uploads
  business_registration_doc TEXT, -- URL to uploaded document
  tax_id_doc TEXT, -- URL to uploaded tax ID document
  additional_docs TEXT[] DEFAULT '{}', -- Additional supporting documents
  
  -- Domain verification
  domain_to_verify TEXT, -- Business website domain
  domain_verification_token TEXT, -- Unique token for email verification
  domain_verified BOOLEAN DEFAULT FALSE,
  domain_verified_at TIMESTAMPTZ,
  
  -- Email verification
  business_email TEXT, -- Email to verify (should match domain)
  email_verification_token TEXT, -- Unique token sent to business email
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  
  -- Justification
  claim_justification TEXT NOT NULL, -- Why they are claiming this business
  
  -- Review process
  reviewed_by UUID REFERENCES auth.users(id), -- Admin who reviewed the claim
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT, -- Internal admin notes
  rejection_reason TEXT, -- Reason for rejection (shown to claimant)
  
  -- Expiration (claims expire after 30 days if not completed)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_business_claim UNIQUE(business_profile_id, claimant_user_id)
);

-- Indexes for business_claim_requests
CREATE INDEX IF NOT EXISTS idx_business_claims_business ON business_claim_requests(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_claimant ON business_claim_requests(claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_status ON business_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_business_claims_pending ON business_claim_requests(status, created_at) 
  WHERE status IN ('pending', 'under_review');
CREATE INDEX IF NOT EXISTS idx_business_claims_expires ON business_claim_requests(expires_at, status) 
  WHERE status IN ('pending', 'under_review');

COMMENT ON TABLE business_claim_requests IS 'Business ownership claim requests with multi-method verification';
COMMENT ON COLUMN business_claim_requests.status IS 'Claim status: pending (submitted), under_review (admin reviewing), approved (claim successful), rejected (denied), expired (30 days passed)';
COMMENT ON COLUMN business_claim_requests.verification_methods IS 'Array of verification methods used: business_registration, tax_id, domain_verification';
COMMENT ON COLUMN business_claim_requests.domain_verification_token IS 'Unique token sent to business email for domain ownership verification';
COMMENT ON COLUMN business_claim_requests.email_verification_token IS 'Unique token sent to business email for email verification';
COMMENT ON COLUMN business_claim_requests.expires_at IS 'Claim expires after 30 days if not completed';

-- ============================================================================
-- BUSINESS CLAIM HISTORY TABLE
-- ============================================================================
-- Audit log of all claim status changes
CREATE TABLE IF NOT EXISTS business_claim_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES business_claim_requests(id) ON DELETE CASCADE,
  
  -- Status change
  previous_status TEXT,
  new_status TEXT NOT NULL,
  
  -- Who made the change
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for claim history
CREATE INDEX IF NOT EXISTS idx_business_claim_history_claim ON business_claim_history(claim_id, created_at DESC);

COMMENT ON TABLE business_claim_history IS 'Audit log of business claim status changes';

-- ============================================================================
-- ENHANCE BUSINESS_PROFILES TABLE
-- ============================================================================
-- Add claim-related fields to business_profiles
ALTER TABLE business_profiles 
  ADD COLUMN IF NOT EXISTS is_claimable BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS original_creator_id UUID REFERENCES auth.users(id);

-- Index for claimable businesses
CREATE INDEX IF NOT EXISTS idx_business_profiles_claimable ON business_profiles(is_claimable, is_claimed) 
  WHERE is_claimable = TRUE AND is_claimed = FALSE;

COMMENT ON COLUMN business_profiles.is_claimable IS 'Whether this business can be claimed by real business owners';
COMMENT ON COLUMN business_profiles.is_claimed IS 'Whether this business has been claimed';
COMMENT ON COLUMN business_profiles.claimed_at IS 'When the business was successfully claimed';
COMMENT ON COLUMN business_profiles.claimed_by IS 'User who successfully claimed the business';
COMMENT ON COLUMN business_profiles.original_creator_id IS 'User who originally created the listing (before claim)';

-- ============================================================================
-- FUNCTIONS FOR CLAIM MANAGEMENT
-- ============================================================================

-- Function to initiate business claim
CREATE OR REPLACE FUNCTION initiate_business_claim(
  p_business_profile_id UUID,
  p_claimant_user_id UUID,
  p_claim_justification TEXT,
  p_business_email TEXT,
  p_domain TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_claim_id UUID;
  v_email_token TEXT;
  v_domain_token TEXT;
  v_business business_profiles%ROWTYPE;
BEGIN
  -- Check if business exists and is claimable
  SELECT * INTO v_business
  FROM business_profiles
  WHERE id = p_business_profile_id;
  
  IF v_business.id IS NULL THEN
    RAISE EXCEPTION 'Business profile not found';
  END IF;
  
  IF NOT v_business.is_claimable THEN
    RAISE EXCEPTION 'This business is not claimable';
  END IF;
  
  IF v_business.is_claimed THEN
    RAISE EXCEPTION 'This business has already been claimed';
  END IF;
  
  -- Check if user already has a pending claim
  IF EXISTS (
    SELECT 1 FROM business_claim_requests
    WHERE business_profile_id = p_business_profile_id
      AND claimant_user_id = p_claimant_user_id
      AND status IN ('pending', 'under_review')
  ) THEN
    RAISE EXCEPTION 'You already have a pending claim for this business';
  END IF;
  
  -- Generate verification tokens
  v_email_token := encode(gen_random_bytes(32), 'hex');
  v_domain_token := encode(gen_random_bytes(16), 'hex');
  
  -- Create claim request
  INSERT INTO business_claim_requests (
    business_profile_id,
    claimant_user_id,
    status,
    claim_justification,
    business_email,
    email_verification_token,
    domain_to_verify,
    domain_verification_token
  ) VALUES (
    p_business_profile_id,
    p_claimant_user_id,
    'pending',
    p_claim_justification,
    p_business_email,
    v_email_token,
    p_domain,
    v_domain_token
  )
  RETURNING id INTO v_claim_id;
  
  -- Log claim creation
  INSERT INTO business_claim_history (claim_id, previous_status, new_status, changed_by, change_reason)
  VALUES (v_claim_id, NULL, 'pending', p_claimant_user_id, 'Claim initiated');
  
  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initiate_business_claim IS 'Initiates a business claim request and generates verification tokens';

-- Function to verify email
CREATE OR REPLACE FUNCTION verify_business_email(
  p_claim_id UUID,
  p_email_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_claim business_claim_requests%ROWTYPE;
BEGIN
  -- Get claim
  SELECT * INTO v_claim
  FROM business_claim_requests
  WHERE id = p_claim_id;
  
  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'Claim request not found';
  END IF;
  
  IF v_claim.email_verification_token != p_email_token THEN
    RETURN FALSE;
  END IF;
  
  IF v_claim.email_verified THEN
    RETURN TRUE; -- Already verified
  END IF;
  
  -- Mark email as verified
  UPDATE business_claim_requests
  SET 
    email_verified = TRUE,
    email_verified_at = NOW(),
    status = CASE 
      WHEN status = 'pending' THEN 'under_review'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_claim_id;
  
  -- Log status change
  IF v_claim.status = 'pending' THEN
    INSERT INTO business_claim_history (claim_id, previous_status, new_status, changed_by, change_reason)
    VALUES (p_claim_id, 'pending', 'under_review', v_claim.claimant_user_id, 'Email verified - moved to review');
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_business_email IS 'Verifies business email using the verification token';

-- Function to verify domain
CREATE OR REPLACE FUNCTION verify_business_domain(
  p_claim_id UUID,
  p_domain_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_claim business_claim_requests%ROWTYPE;
BEGIN
  -- Get claim
  SELECT * INTO v_claim
  FROM business_claim_requests
  WHERE id = p_claim_id;
  
  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'Claim request not found';
  END IF;
  
  IF v_claim.domain_verification_token != p_domain_token THEN
    RETURN FALSE;
  END IF;
  
  IF v_claim.domain_verified THEN
    RETURN TRUE; -- Already verified
  END IF;
  
  -- Mark domain as verified
  UPDATE business_claim_requests
  SET 
    domain_verified = TRUE,
    domain_verified_at = NOW(),
    updated_at = NOW()
  WHERE id = p_claim_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_business_domain IS 'Verifies domain ownership using the verification token';

-- Function to approve claim and transfer ownership
CREATE OR REPLACE FUNCTION approve_business_claim(
  p_claim_id UUID,
  p_admin_user_id UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_claim business_claim_requests%ROWTYPE;
  v_business business_profiles%ROWTYPE;
BEGIN
  -- Get claim
  SELECT * INTO v_claim
  FROM business_claim_requests
  WHERE id = p_claim_id;
  
  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'Claim request not found';
  END IF;
  
  IF v_claim.status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Claim is not in a state that can be approved';
  END IF;
  
  -- Get business profile
  SELECT * INTO v_business
  FROM business_profiles
  WHERE id = v_claim.business_profile_id;
  
  -- Update claim status
  UPDATE business_claim_requests
  SET 
    status = 'approved',
    reviewed_by = p_admin_user_id,
    reviewed_at = NOW(),
    review_notes = p_review_notes,
    updated_at = NOW()
  WHERE id = p_claim_id;
  
  -- Transfer business ownership
  UPDATE business_profiles
  SET 
    user_id = v_claim.claimant_user_id, -- Transfer ownership
    is_claimed = TRUE,
    claimed_at = NOW(),
    claimed_by = v_claim.claimant_user_id,
    original_creator_id = COALESCE(original_creator_id, user_id), -- Save original creator if not already set
    is_verified = TRUE, -- Mark as verified since claim was approved
    verified_at = NOW(),
    updated_at = NOW()
  WHERE id = v_claim.business_profile_id;
  
  -- Log claim approval
  INSERT INTO business_claim_history (claim_id, previous_status, new_status, changed_by, change_reason)
  VALUES (p_claim_id, v_claim.status, 'approved', p_admin_user_id, 'Claim approved - ownership transferred');
  
  -- Cancel any other pending claims for this business
  UPDATE business_claim_requests
  SET 
    status = 'rejected',
    rejection_reason = 'Another user''s claim was approved first',
    updated_at = NOW()
  WHERE business_profile_id = v_claim.business_profile_id
    AND id != p_claim_id
    AND status IN ('pending', 'under_review');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION approve_business_claim IS 'Approves claim request and transfers business ownership to claimant';

-- Function to reject claim
CREATE OR REPLACE FUNCTION reject_business_claim(
  p_claim_id UUID,
  p_admin_user_id UUID,
  p_rejection_reason TEXT,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_claim business_claim_requests%ROWTYPE;
BEGIN
  -- Get claim
  SELECT * INTO v_claim
  FROM business_claim_requests
  WHERE id = p_claim_id;
  
  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'Claim request not found';
  END IF;
  
  IF v_claim.status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Claim is not in a state that can be rejected';
  END IF;
  
  -- Update claim status
  UPDATE business_claim_requests
  SET 
    status = 'rejected',
    reviewed_by = p_admin_user_id,
    reviewed_at = NOW(),
    rejection_reason = p_rejection_reason,
    review_notes = p_review_notes,
    updated_at = NOW()
  WHERE id = p_claim_id;
  
  -- Log claim rejection
  INSERT INTO business_claim_history (claim_id, previous_status, new_status, changed_by, change_reason)
  VALUES (p_claim_id, v_claim.status, 'rejected', p_admin_user_id, p_rejection_reason);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reject_business_claim IS 'Rejects a business claim request with reason';

-- Function to expire old claims
CREATE OR REPLACE FUNCTION expire_old_claims()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Expire claims that are past their expiration date
  WITH expired_claims AS (
    UPDATE business_claim_requests
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE status IN ('pending', 'under_review')
      AND expires_at < NOW()
    RETURNING id, status
  )
  SELECT COUNT(*) INTO v_expired_count FROM expired_claims;
  
  -- Log expirations
  INSERT INTO business_claim_history (claim_id, previous_status, new_status, change_reason)
  SELECT 
    id,
    status,
    'expired',
    '30-day deadline passed'
  FROM business_claim_requests
  WHERE status = 'expired'
    AND updated_at >= NOW() - INTERVAL '1 minute'; -- Recently expired
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_claims IS 'Expires business claims that are older than 30 days. Returns count of expired claims.';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update business_claim_requests.updated_at
CREATE OR REPLACE FUNCTION update_business_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_business_claims_updated_at ON business_claim_requests;
CREATE TRIGGER trigger_update_business_claims_updated_at
  BEFORE UPDATE ON business_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_business_claims_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on business_claim_requests
ALTER TABLE business_claim_requests ENABLE ROW LEVEL SECURITY;


-- Drop existing policies if they exist
DROP POLICY IF EXISTS business_claims_user_view ON business_claim_requests;
DROP POLICY IF EXISTS business_claims_user_insert ON business_claim_requests;
DROP POLICY IF EXISTS business_claims_user_update ON business_claim_requests;
DROP POLICY IF EXISTS business_claims_service_all ON business_claim_requests;
-- Users can view their own claims
CREATE POLICY business_claims_user_view ON business_claim_requests
  FOR SELECT
  TO authenticated
  USING (claimant_user_id = auth.uid());

-- Users can create claims
CREATE POLICY business_claims_user_insert ON business_claim_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (claimant_user_id = auth.uid());

-- Users can update their own pending claims (to upload documents)
CREATE POLICY business_claims_user_update ON business_claim_requests
  FOR UPDATE
  TO authenticated
  USING (claimant_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (claimant_user_id = auth.uid());

-- Service role can manage all claims (for admin operations)
CREATE POLICY business_claims_service_all ON business_claim_requests
  FOR ALL
  TO service_role
  USING (true);

-- Enable RLS on business_claim_history
ALTER TABLE business_claim_history ENABLE ROW LEVEL SECURITY;


-- Drop existing policies if they exist
DROP POLICY IF EXISTS business_claim_history_user_view ON business_claim_history;
DROP POLICY IF EXISTS business_claim_history_service_all ON business_claim_history;
-- Users can view history of their own claims
CREATE POLICY business_claim_history_user_view ON business_claim_history
  FOR SELECT
  TO authenticated
  USING (
    claim_id IN (
      SELECT id FROM business_claim_requests WHERE claimant_user_id = auth.uid()
    )
  );

-- Service role can view all history
CREATE POLICY business_claim_history_service_all ON business_claim_history
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View for active claimable businesses
CREATE OR REPLACE VIEW claimable_businesses AS
SELECT 
  bp.id,
  bp.business_name,
  bp.display_name,
  bp.city,
  bp.state,
  bp.primary_category_id,
  bp.average_rating,
  bp.review_count,
  bp.is_verified,
  bp.created_at,
  COUNT(bcr.id) AS pending_claim_count
FROM business_profiles bp
LEFT JOIN business_claim_requests bcr 
  ON bp.id = bcr.business_profile_id 
  AND bcr.status IN ('pending', 'under_review')
WHERE bp.is_claimable = TRUE
  AND bp.is_claimed = FALSE
  AND bp.is_active = TRUE
GROUP BY bp.id;

COMMENT ON VIEW claimable_businesses IS 'View of businesses available for claiming';

-- View for claim statistics
CREATE OR REPLACE VIEW claim_statistics AS
SELECT 
  status,
  COUNT(*) AS count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(reviewed_at, NOW()) - created_at)) / 86400) AS avg_days_to_resolution
FROM business_claim_requests
GROUP BY status;

COMMENT ON VIEW claim_statistics IS 'Statistics on business claims by status';

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 048: Claimable Business Listings completed successfully';
  RAISE NOTICE '  - Tables created: business_claim_requests, business_claim_history';
  RAISE NOTICE '  - Business_profiles table enhanced with claim-related columns';
  RAISE NOTICE '  - Functions created: initiate_business_claim, verify_business_email, verify_business_domain, approve_business_claim, reject_business_claim, expire_old_claims';
  RAISE NOTICE '  - Triggers created: Auto-update timestamps';
  RAISE NOTICE '  - RLS policies enabled for claim tables';
  RAISE NOTICE '  - Views created: claimable_businesses, claim_statistics';
  RAISE NOTICE '  - Verification methods supported: business_registration, tax_id, domain_verification, email_verification';
  RAISE NOTICE '  - Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6';
END $$;
