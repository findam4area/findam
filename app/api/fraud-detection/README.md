# Fraud Detection API

Advanced fraud detection system that analyzes user behavior patterns, detects suspicious activity, and calculates risk scores.

## Requirements

- **Requirement 24.1**: Analyze user behavior patterns (listing frequency, pricing anomalies, communication patterns)
- **Requirement 24.2**: Flag accounts with suspicious activity (failed transactions, buyer complaints)
- **Requirement 24.3**: Detect coordinated fraud rings (network connections between accounts)
- **Requirement 24.4**: Suspend accounts when fraud risk score exceeds 80%
- **Requirement 24.5**: Analyze payment patterns (money laundering, fraudulent transactions)
- **Requirement 24.6**: Cross-reference phone numbers and NIN data to detect duplicate accounts
- **Requirement 24.7**: Monitor velocity abuse (rapid account creation, listing posting)
- **Requirement 24.8**: Generate risk scores for transactions based on buyer-seller history and item value
- **Requirement 24.9**: Provide fraud alerts when interacting with flagged accounts
- **Requirement 24.10**: Maintain fraud database that improves detection accuracy

## Endpoints

### POST /api/fraud-detection/calculate-score

Calculate or update fraud score for a user.

**Authentication**: Admin only

**Request Body**:

```json
{
  "userId": "user-uuid"
}
```

**Response**:

```json
{
  "success": true,
  "fraudScore": 45.5,
  "riskLevel": "medium",
  "factors": {
    "account_age_score": 20,
    "failed_transactions_score": 30,
    "complaints_score": 0,
    "velocity_abuse_score": 0,
    "network_risk_score": 0,
    "pricing_anomaly_score": 15,
    "duplicate_account_score": 0
  },
  "metrics": {
    "account_age_days": 45,
    "failed_transaction_count": 2,
    "complaint_count": 0,
    "rapid_listing_count": 3,
    "suspicious_price_count": 0,
    "linked_accounts": []
  },
  "isSuspended": false,
  "suspensionReason": null
}
```

### POST /api/fraud-detection/transaction-risk

Generate risk score for a transaction between buyer and seller.

**Authentication**: Buyer or Seller

**Request Body**:

```json
{
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "itemValue": 50000
}
```

**Response**:

```json
{
  "success": true,
  "riskScore": 25,
  "riskLevel": "low",
  "factors": [
    "First transaction between parties",
    "Medium-high value transaction"
  ]
}
```

### GET /api/fraud-detection/user-alert?userId=xxx

Get fraud alert for a user when interacting with them.

**Authentication**: Required

**Query Parameters**:

- `userId`: User ID to check

**Response**:

```json
{
  "success": true,
  "hasAlert": true,
  "alertMessage": "⚠️ Caution: This account has been flagged for suspicious activity. Please exercise caution when transacting."
}
```

### POST /api/fraud-detection/suspend-account

Manually suspend a high-risk account.

**Authentication**: Admin only

**Request Body**:

```json
{
  "userId": "user-uuid",
  "reason": "Multiple failed transactions and buyer complaints"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Account suspended successfully"
}
```

## Fraud Detection Engine

The `FraudDetectionEngine` class provides comprehensive fraud detection capabilities:

### Behavior Analysis

- **Listing Frequency**: Detects users posting excessive listings (>10/day)
- **Pricing Anomalies**: Identifies suspiciously low prices or inconsistent pricing
- **Communication Patterns**: Flags poor response times and low response rates

### Suspicious Activity Flagging

- **Failed Transactions**: Tracks refunded/disputed transactions
- **Buyer Complaints**: Monitors low ratings and negative reviews

### Fraud Ring Detection

- **Network Analysis**: Identifies accounts sharing phone numbers or NIN data
- **Connection Strength**: Calculates relationship strength between accounts

### Payment Pattern Analysis

- **High-Value Transactions**: Flags rapid high-value transactions
- **Round Numbers**: Detects money laundering indicators
- **Transaction Velocity**: Monitors transaction frequency
- **Structuring**: Identifies breaking large amounts into smaller transactions

### Duplicate Account Detection

- **Phone Matching**: Cross-references phone numbers
- **NIN Matching**: Cross-references National Identification Numbers

### Velocity Abuse Monitoring

- **Rapid Account Creation**: Detects multiple accounts from same phone/NIN
- **Rapid Listing Posting**: Flags excessive listing creation (>20/day)

### Risk Scoring Algorithm

Calculates weighted fraud score (0-100) based on multiple factors:

- Account Age: 10%
- Failed Transactions: 20%
- Complaints: 15%
- Velocity Abuse: 15%
- Network Risk: 20%
- Pricing Anomaly: 10%
- Duplicate Account: 10%

**Risk Levels**:

- Low: 0-39
- Medium: 40-59
- High: 60-79
- Critical: 80-100

### Automatic Suspension

Accounts with fraud score >80% are automatically suspended:

- All active listings are deactivated
- User receives suspension notification
- Admin can review and unsuspend if needed

## Cron Job

### GET /api/cron/calculate-fraud-scores

Periodically calculates fraud scores for all active users.

**Authentication**: Cron secret (Bearer token)

**Schedule**: Daily

**Response**:

```json
{
  "success": true,
  "message": "Fraud scores calculated successfully",
  "processed": 1523,
  "suspended": 12,
  "errors": 0,
  "errorUserIds": []
}
```

## Usage Examples

### Check User Before Transaction

```typescript
// Get fraud alert for seller
const response = await fetch(
  `/api/fraud-detection/user-alert?userId=${sellerId}`,
);
const { hasAlert, alertMessage } = await response.json();

if (hasAlert) {
  // Show warning to buyer
  alert(alertMessage);
}
```

### Calculate Transaction Risk

```typescript
// Before processing payment
const response = await fetch("/api/fraud-detection/transaction-risk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    buyerId: currentUser.id,
    sellerId: listing.user_id,
    itemValue: listing.price,
  }),
});

const { riskScore, riskLevel, factors } = await response.json();

if (riskLevel === "high" || riskLevel === "critical") {
  // Require additional verification
  showVerificationModal();
}
```

### Admin: Calculate Fraud Score

```typescript
// Admin dashboard
const response = await fetch("/api/fraud-detection/calculate-score", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: suspiciousUserId }),
});

const { fraudScore, riskLevel, factors, metrics } = await response.json();

// Display fraud analysis
showFraudAnalysis({ fraudScore, riskLevel, factors, metrics });
```

## Database Schema

The fraud detection system uses the `fraud_scores` table:

```sql
CREATE TABLE fraud_scores (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  fraud_score DECIMAL(5, 2) CHECK (fraud_score >= 0 AND fraud_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  factors JSONB,
  metrics JSONB,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES users(id),
  alerts_sent JSONB DEFAULT '[]',
  last_alert_sent_at TIMESTAMPTZ,
  last_calculated_at TIMESTAMPTZ,
  calculation_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Considerations

1. **Admin-Only Access**: Score calculation and suspension require admin role
2. **Rate Limiting**: API endpoints should be rate-limited to prevent abuse
3. **Audit Logging**: All fraud actions are logged with timestamps and admin IDs
4. **Privacy**: Fraud scores are only visible to admins, not to regular users
5. **False Positives**: Manual review process for flagged accounts

## Future Enhancements

1. **Machine Learning**: Train ML models on historical fraud data
2. **IP Tracking**: Add IP address analysis for fraud ring detection
3. **Device Fingerprinting**: Track device IDs for duplicate account detection
4. **Behavioral Biometrics**: Analyze typing patterns and mouse movements
5. **External Data**: Integrate with credit bureaus and identity verification services
