# AI Content Moderation Services

This directory contains services for AI-powered content moderation and fraud detection.

## Setup Instructions

### 1. Install OpenAI Package

```bash
npm install openai
```

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# OpenAI Configuration (AI Moderation)
OPENAI_API_KEY=your_openai_api_key
```

To get an OpenAI API key:

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

### 3. Run Database Migration

Apply the AI moderation infrastructure migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply the migration file directly
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/011_ai_moderation_infrastructure.sql
```

This creates:

- `moderation_results` table - Stores AI scan results with confidence scores
- `fraud_scores` table - Tracks user fraud risk scores
- Helper functions and views for moderation workflows
- RLS policies for secure access

## Services

### OpenAI Moderation Service (`openai-moderation.ts`)

Provides AI-powered content moderation using OpenAI's Moderation API.

#### Key Functions

**`scanTextContent(text: string)`**

- Scans text content for prohibited content
- Returns moderation result with violations and confidence score
- Auto-determines action: approve (<60%), flag (60-85%), reject (>85%)

**`scanMultipleFields(fields: Record<string, string>)`**

- Scans multiple text fields (title, description, etc.)
- Combines fields and returns unified moderation result

**`detectScamIndicators(text: string)`**

- Pattern-based detection of common scam phrases
- Returns scam indicators and confidence score

**`detectPriceAnomaly(price: number, category: string, averagePrice?: number)`**

- Detects suspiciously low prices
- Compares against category averages

**`checkOpenAIHealth()`**

- Health check for OpenAI API connectivity

#### Usage Example

```typescript
import {
  scanTextContent,
  detectScamIndicators,
} from "@/lib/services/openai-moderation";

// Scan listing content
const result = await scanTextContent(listingDescription);

if (result.action === "reject") {
  // Auto-reject listing
  console.log("Listing rejected:", result.violations);
} else if (result.action === "flag") {
  // Flag for manual review
  console.log("Listing flagged for review:", result.violations);
} else {
  // Approve listing
  console.log("Listing approved");
}

// Check for scam indicators
const scamCheck = detectScamIndicators(listingDescription);
if (scamCheck.hasScamIndicators) {
  console.log("Scam indicators found:", scamCheck.indicators);
}
```

## Database Schema

### moderation_results Table

Stores AI moderation scan results for listings.

**Key Columns:**

- `listing_id` - Reference to the listing being moderated
- `confidence_score` - AI confidence (0-100)
- `action` - Moderation action: 'approve', 'flag', 'reject'
- `violations` - JSONB array of violation objects
- `admin_reviewed` - Whether admin has reviewed flagged content

**Confidence-Based Actions:**

- **>85%**: Auto-reject listing
- **60-85%**: Flag for manual review
- **<60%**: Auto-approve listing

### fraud_scores Table

Tracks user fraud risk scores and contributing factors.

**Key Columns:**

- `user_id` - Reference to the user
- `fraud_score` - Overall risk score (0-100)
- `risk_level` - 'low', 'medium', 'high', 'critical'
- `factors` - JSONB object with individual risk factor scores
- `metrics` - JSONB object with detailed metrics
- `is_suspended` - Whether account is suspended

**Risk Levels:**

- **<40**: Low risk
- **40-59**: Medium risk
- **60-79**: High risk
- **≥80**: Critical risk (automatic suspension)

## Views

### flagged_listings_queue

Shows all listings flagged for manual review, ordered by confidence score.

```sql
SELECT * FROM flagged_listings_queue;
```

### high_risk_users

Shows all users with fraud score > 60, ordered by risk score.

```sql
SELECT * FROM high_risk_users;
```

## Helper Functions

### calculate_risk_level(score DECIMAL)

Converts fraud score to risk level.

```sql
SELECT calculate_risk_level(75); -- Returns 'high'
```

### determine_moderation_action(confidence DECIMAL, has_violations BOOLEAN)

Determines moderation action based on confidence score.

```sql
SELECT determine_moderation_action(90, true); -- Returns 'reject'
```

## Security

- All API keys stored in environment variables
- RLS policies restrict access to moderation data
- Admins can view all moderation results
- Users can only view their own moderation results
- Fraud scores only visible to admins

## Testing

Health check the OpenAI API:

```typescript
import { checkOpenAIHealth } from "@/lib/services/openai-moderation";

const isHealthy = await checkOpenAIHealth();
console.log("OpenAI API status:", isHealthy ? "OK" : "Error");
```

## Next Steps

The actual moderation logic will be implemented in Task 9:

- Create ContentModerationService class
- Implement comprehensive listing scanning
- Add image content scanning
- Implement duplicate detection
- Create moderation API endpoints
- Build admin moderation queue UI

## Requirements Mapping

- **Requirement 6.1**: AI scans listings for prohibited content ✓
- **Requirement 6.6**: Auto-reject >85%, flag 60-85% ✓
- **Requirement 24.1**: Fraud detection analyzes user behavior patterns ✓
- **Requirement 24.4**: High-risk accounts (>80%) automatically suspended ✓
