/**
 * Type definitions for AI Content Moderation and Fraud Detection
 *
 * Requirements: 6 (AI Content Moderation), 24 (Advanced Fraud Detection)
 * Tasks: 8.1, 8.2
 */

/**
 * Moderation action types
 */
export type ModerationAction = "approve" | "flag" | "reject";

/**
 * Moderation scan types
 */
export type ModerationScanType =
  | "text"
  | "image"
  | "price"
  | "duplicate"
  | "behavior"
  | "comprehensive";

/**
 * Violation severity levels
 */
export type ViolationSeverity = "low" | "medium" | "high";

/**
 * Admin decision types
 */
export type AdminDecision = "approve" | "reject";

/**
 * Violation object structure
 */
export interface Violation {
  type: string;
  severity: ViolationSeverity;
  details: string;
  confidence?: number;
}

/**
 * Scanned content structure
 */
export interface ScannedContent {
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
  category?: string;
}

/**
 * Moderation result from database
 */
export interface ModerationResult {
  id: string;
  listing_id: string | null;
  user_id: string;

  // Moderation decision
  approved: boolean;
  confidence_score: number;
  action: ModerationAction;

  // Violation details
  violations: Violation[];

  // Scan metadata
  scanned_content: ScannedContent;
  scan_type: ModerationScanType;

  // Admin review
  admin_reviewed: boolean;
  admin_id: string | null;
  admin_notes: string | null;
  admin_decision: AdminDecision | null;
  reviewed_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Moderation result insert type
 */
export interface ModerationResultInsert {
  listing_id?: string;
  user_id: string;
  approved: boolean;
  confidence_score: number;
  action: ModerationAction;
  violations: Violation[];
  scanned_content: ScannedContent;
  scan_type: ModerationScanType;
}

/**
 * Moderation result update type
 */
export interface ModerationResultUpdate {
  admin_reviewed?: boolean;
  admin_id?: string;
  admin_notes?: string;
  admin_decision?: AdminDecision;
  reviewed_at?: string;
}

/**
 * Risk levels for fraud detection
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Fraud risk factors
 */
export interface FraudFactors {
  account_age_score?: number;
  failed_transactions_score?: number;
  complaints_score?: number;
  velocity_abuse_score?: number;
  network_risk_score?: number;
  pricing_anomaly_score?: number;
  duplicate_account_score?: number;
}

/**
 * Fraud detection metrics
 */
export interface FraudMetrics {
  account_age_days?: number;
  failed_transaction_count?: number;
  complaint_count?: number;
  rapid_listing_count?: number;
  suspicious_price_count?: number;
  linked_accounts?: string[];
}

/**
 * Fraud alert object
 */
export interface FraudAlert {
  type: string;
  message: string;
  timestamp: string;
  severity: ViolationSeverity;
}

/**
 * Fraud score from database
 */
export interface FraudScore {
  id: string;
  user_id: string;

  // Risk assessment
  fraud_score: number;
  risk_level: RiskLevel;

  // Contributing factors
  factors: FraudFactors;
  metrics: FraudMetrics;

  // Actions taken
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;

  // Alert tracking
  alerts_sent: FraudAlert[];
  last_alert_sent_at: string | null;

  // Calculation metadata
  last_calculated_at: string;
  calculation_version: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Fraud score insert type
 */
export interface FraudScoreInsert {
  user_id: string;
  fraud_score: number;
  risk_level: RiskLevel;
  factors?: FraudFactors;
  metrics?: FraudMetrics;
  calculation_version?: string;
}

/**
 * Fraud score update type
 */
export interface FraudScoreUpdate {
  fraud_score?: number;
  risk_level?: RiskLevel;
  factors?: FraudFactors;
  metrics?: FraudMetrics;
  is_suspended?: boolean;
  suspension_reason?: string;
  suspended_at?: string;
  suspended_by?: string;
  alerts_sent?: FraudAlert[];
  last_alert_sent_at?: string;
  last_calculated_at?: string;
  calculation_version?: string;
}

/**
 * Flagged listing from view
 */
export interface FlaggedListing {
  moderation_id: string;
  listing_id: string;
  user_id: string;
  confidence_score: number;
  violations: Violation[];
  flagged_at: string;
  listing_title: string;
  listing_price: number;
  category_id: string;
  seller_username: string;
  seller_email: string;
}

/**
 * High-risk user from view
 */
export interface HighRiskUser {
  fraud_score_id: string;
  user_id: string;
  fraud_score: number;
  risk_level: RiskLevel;
  factors: FraudFactors;
  metrics: FraudMetrics;
  is_suspended: boolean;
  last_calculated_at: string;
  username: string;
  email: string;
  phone: string | null;
  user_created_at: string;
}

/**
 * Moderation statistics
 */
export interface ModerationStats {
  total_scans: number;
  approved_count: number;
  flagged_count: number;
  rejected_count: number;
  pending_review_count: number;
  average_confidence: number;
}

/**
 * Fraud detection statistics
 */
export interface FraudStats {
  total_users_scored: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  critical_risk_count: number;
  suspended_count: number;
  average_fraud_score: number;
}
