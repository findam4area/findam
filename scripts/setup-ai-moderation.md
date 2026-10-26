# AI Content Moderation Setup Guide

This guide walks you through setting up the AI content moderation infrastructure for FindAm.

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- Database access credentials

## Step 1: Install Dependencies

Install the OpenAI package:

```bash
npm install openai
```

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env.local` if you haven't already:

```bash
cp .env.example .env.local
```

2. Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Getting an OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)
6. Paste it into your `.env.local` file

**Note**: OpenAI API usage is pay-as-you-go. The Moderation API is free, but you'll need to add a payment method to your OpenAI account.

## Step 3: Run Database Migration

Apply the AI moderation infrastructure migration:

### Option A: Using Supabase CLI (Recommended)

```bash
# Make sure you're logged in to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

### Option B: Using SQL directly

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Open the file `supabase/migrations/011_ai_moderation_infrastructure.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run"

### Option C: Using psql

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/011_ai_moderation_infrastructure.sql
```

## Step 4: Verify Installation

### Check Database Tables

Run this SQL query in your Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('moderation_results', 'fraud_scores');

-- Check if views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('flagged_listings_queue', 'high_risk_users');
```

You should see:

- `moderation_results` table
- `fraud_scores` table
- `flagged_listings_queue` view
- `high_risk_users` view

### Test OpenAI Connection

Create a test file `test-openai.ts`:

```typescript
import { checkOpenAIHealth } from "./lib/services/openai-moderation";

async function test() {
  console.log("Testing OpenAI connection...");
  const isHealthy = await checkOpenAIHealth();

  if (isHealthy) {
    console.log("✓ OpenAI API is working correctly!");
  } else {
    console.log("✗ OpenAI API connection failed. Check your API key.");
  }
}

test();
```

Run it:

```bash
npx tsx test-openai.ts
```

## Step 5: Verify Fraud Score Creation

Check that fraud scores are automatically created for existing users:

```sql
-- Count users with fraud scores
SELECT COUNT(*) as users_with_scores FROM fraud_scores;

-- Should match total user count
SELECT COUNT(*) as total_users FROM users;
```

If counts don't match, fraud scores will be created automatically for new users. For existing users without scores, run:

```sql
INSERT INTO fraud_scores (user_id, fraud_score, risk_level)
SELECT id, 0, 'low'
FROM users
WHERE id NOT IN (SELECT user_id FROM fraud_scores);
```

## What Was Created

### Database Tables

1. **moderation_results**
   - Stores AI moderation scan results
   - Tracks confidence scores and violations
   - Supports admin review workflow

2. **fraud_scores**
   - Stores user fraud risk scores
   - Tracks contributing factors and metrics
   - Supports automatic suspension

### Database Views

1. **flagged_listings_queue**
   - Shows listings requiring manual review
   - Ordered by confidence score

2. **high_risk_users**
   - Shows users with fraud score > 60
   - Ordered by risk level

### Helper Functions

1. **calculate_risk_level(score)**
   - Converts fraud score to risk level

2. **determine_moderation_action(confidence, has_violations)**
   - Determines action based on confidence

3. **create_fraud_score_for_user()**
   - Auto-creates fraud score for new users

### Services

1. **openai-moderation.ts**
   - OpenAI API integration
   - Text content scanning
   - Scam indicator detection
   - Price anomaly detection

### Type Definitions

1. **types/moderation.ts**
   - TypeScript interfaces for all moderation types
   - Ensures type safety across the application

## Next Steps

Now that the infrastructure is set up, you can proceed to Task 9:

1. Create ContentModerationService class
2. Implement comprehensive listing scanning
3. Add image content scanning
4. Implement duplicate detection
5. Create moderation API endpoints
6. Build admin moderation queue UI

## Troubleshooting

### "OPENAI_API_KEY is not set" Error

Make sure:

1. You've added the key to `.env.local`
2. You've restarted your development server
3. The key starts with `sk-`

### Migration Fails

If the migration fails:

1. Check that you have the `uuid_generate_v4()` extension enabled
2. Verify you have admin access to the database
3. Check for any existing tables with the same names

### OpenAI API Errors

Common issues:

1. **Invalid API key**: Double-check your key
2. **Rate limit exceeded**: You've made too many requests
3. **Insufficient quota**: Add a payment method to your OpenAI account

## Support

For issues or questions:

1. Check the README in `lib/services/`
2. Review the migration file comments
3. Consult the OpenAI API documentation: https://platform.openai.com/docs/

## Security Notes

- Never commit `.env.local` to version control
- Keep your OpenAI API key secret
- Rotate keys regularly
- Monitor API usage in OpenAI dashboard
- Set up usage limits to prevent unexpected charges
