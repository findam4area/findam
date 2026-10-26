-- Migration: AI Content Moderation and Fraud Detection Infrastructure
-- Requirements: 6 (AI Content Moderation), 24 (Advanced Fraud Detection)
-- Tasks: 8.1, 8.2

-- ============================================================================
-- MODERATION RESULTS TABLE (Task 8.1)
-- ============================================================================
-- Stores AI moderation scan results for listings
-- Supports confidence-based actions: auto-reject (>85%), flag (60-85%), approve (<60%)
CREATE TABLE moderation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Moderation decision
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_score DECIMAL(5, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  action TEXT NOT NULL CHECK (action IN ('approve', 'flag', 'reject')),
  
  -- Violation details
  violations JSONB NOT NULL DEFAULT '[]', -- Array of violation objects
  -- Example: [{"type": "prohibited_item", "severity": "high", "details": "Weapons detected"}]
  
  -- Scan metadata
  scanned_content JSONB NOT NULL, -- {title, description, images, price, category}
  scan_type TEXT NOT NULL CHECK (scan_type IN ('text', 'image', 'price', 'duplicate', 'behavior', 'comprehensive')),
  
  -- Moderation actions
  admin_reviewed BOOLEAN DEFAULT FALSE,
  admin_id UUID REFERENCES users(id),
  admin_notes TEXT,
  admin_decision TEXT CHECK (admin_decision IN ('approve', 'reject', NULL)),
  reviewed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for moderation_results (Task 8.1)
CREATE INDEX idx_moderation_listing ON moderation_results(listing_id);
CREATE INDEX idx_moderation_user ON moderation_results(user_id);
CREATE INDEX idx_moderation_action ON moderation_results(action);
CREATE INDEX idx_moderation_confidence ON moderation_results(confidence_score DESC);
CREATE INDEX idx_moderation_flagged ON moderation_results(action, admin_reviewed) WHERE action = 'flag' AND admin_reviewed = FALSE;
CREATE INDEX idx_moderation_created ON moderation_results(created_at DESC);

-- ============================================================================
-- FRAUD SCORES TABLE (Task 8.2)
-- ============================================================================
-- Stores user fraud risk scores and contributing factors
-- High-risk accounts (>80%) are automatically suspended
CREATE TABLE fraud_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Risk assessment
  fraud_score DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Contributing factors (0-100 each)
  factors JSONB NOT NULL DEFAULT '{}',
  -- Example: {
  --   "account_age_score": 20,
  --   "failed_transactions_score": 40,
  --   "complaints_score": 30,
  --   "velocity_abuse_score": 10,
  --   "network_risk_score": 15,
  --   "pricing_anomaly_score": 25,
  --   "duplicate_account_score": 50
  -- }
  
  -- Detailed metrics
  metrics JSONB NOT NULL DEFAULT '{}',
  -- Example: {
  --   "account_age_days": 5,
  --   "failed_transaction_count": 3,
  --   "complaint_count": 2,
  --   "rapid_listing_count": 15,
  --   "suspicious_price_count": 4,
  --   "linked_accounts": ["user_id_1", "user_id_2"]
  -- }
  
  -- Actions taken
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES users(id),
  
  -- Alert tracking
  alerts_sent JSONB DEFAULT '[]', -- Array of alert objects with timestamps
  last_alert_sent_at TIMESTAMPTZ,
  
  -- Calculation metadata
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculation_version TEXT NOT NULL DEFAULT '1.0', -- For tracking algorithm versions
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fraud_scores (Task 8.2)
CREATE UNIQUE INDEX idx_fraud_user ON fraud_scores(user_id);
CREATE INDEX idx_fraud_score ON fraud_scores(fraud_score DESC);
CREATE INDEX idx_fraud_risk_level ON fraud_scores(risk_level);
CREATE INDEX idx_fraud_suspended ON fraud_scores(is_suspended) WHERE is_suspended = TRUE;
CREATE INDEX idx_fraud_high_risk ON fraud_scores(fraud_score) WHERE fraud_score > 80;
CREATE INDEX idx_fraud_last_calculated ON fraud_scores(last_calculated_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Update moderation_results.updated_at
CREATE OR REPLACE FUNCTION update_moderation_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_moderation_results_updated_at
  BEFORE UPDATE ON moderation_results
  FOR EACH ROW
  EXECUTE FUNCTION update_moderation_results_updated_at();

-- Update fraud_scores.updated_at
CREATE OR REPLACE FUNCTION update_fraud_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fraud_scores_updated_at
  BEFORE UPDATE ON fraud_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_fraud_scores_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate risk level from fraud score
CREATE OR REPLACE FUNCTION calculate_risk_level(score DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF score >= 80 THEN
    RETURN 'critical';
  ELSIF score >= 60 THEN
    RETURN 'high';
  ELSIF score >= 40 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine moderation action based on confidence score
CREATE OR REPLACE FUNCTION determine_moderation_action(confidence DECIMAL, has_violations BOOLEAN)
RETURNS TEXT AS $$
BEGIN
  IF NOT has_violations THEN
    RETURN 'approve';
  ELSIF confidence > 85 THEN
    RETURN 'reject';
  ELSIF confidence >= 60 THEN
    RETURN 'flag';
  ELSE
    RETURN 'approve';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically create fraud score record for new users
CREATE OR REPLACE FUNCTION create_fraud_score_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO fraud_scores (user_id, fraud_score, risk_level)
  VALUES (NEW.id, 0, 'low');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_fraud_score_for_user
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_fraud_score_for_user();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for flagged listings requiring manual review
CREATE OR REPLACE VIEW flagged_listings_queue AS
SELECT 
  mr.id AS moderation_id,
  mr.listing_id,
  mr.user_id,
  mr.confidence_score,
  mr.violations,
  mr.created_at AS flagged_at,
  l.title AS listing_title,
  l.price AS listing_price,
  l.category_id,
  u.username AS seller_username,
  u.email AS seller_email
FROM moderation_results mr
JOIN listings l ON mr.listing_id = l.id
JOIN users u ON mr.user_id = u.id
WHERE mr.action = 'flag' 
  AND mr.admin_reviewed = FALSE
ORDER BY mr.confidence_score DESC, mr.created_at ASC;

-- View for high-risk users
CREATE OR REPLACE VIEW high_risk_users AS
SELECT 
  fs.id AS fraud_score_id,
  fs.user_id,
  fs.fraud_score,
  fs.risk_level,
  fs.factors,
  fs.metrics,
  fs.is_suspended,
  fs.last_calculated_at,
  u.username,
  u.email,
  u.phone,
  u.created_at AS user_created_at
FROM fraud_scores fs
JOIN users u ON fs.user_id = u.id
WHERE fs.fraud_score > 60
ORDER BY fs.fraud_score DESC;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on moderation_results
ALTER TABLE moderation_results ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for backend operations)
CREATE POLICY moderation_results_service_all ON moderation_results
  FOR ALL
  TO service_role
  USING (true);

-- Users can view their own moderation results
CREATE POLICY moderation_results_user_view ON moderation_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Enable RLS on fraud_scores
ALTER TABLE fraud_scores ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for backend operations)
CREATE POLICY fraud_scores_service_all ON fraud_scores
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE moderation_results IS 'AI moderation scan results with confidence-based actions';
COMMENT ON TABLE fraud_scores IS 'User fraud risk scores with automatic suspension for high-risk accounts (>80%)';

COMMENT ON COLUMN moderation_results.confidence_score IS 'AI confidence score (0-100): >85% auto-reject, 60-85% flag for review, <60% approve';
COMMENT ON COLUMN moderation_results.violations IS 'Array of violation objects: [{type, severity, details}]';
COMMENT ON COLUMN moderation_results.action IS 'Moderation action: approve, flag (manual review), or reject';

COMMENT ON COLUMN fraud_scores.fraud_score IS 'Overall fraud risk score (0-100): >80% triggers automatic suspension';
COMMENT ON COLUMN fraud_scores.risk_level IS 'Risk level: low (<40), medium (40-59), high (60-79), critical (≥80)';
COMMENT ON COLUMN fraud_scores.factors IS 'Individual risk factor scores contributing to overall fraud_score';
COMMENT ON COLUMN fraud_scores.metrics IS 'Detailed metrics used to calculate risk factors';
