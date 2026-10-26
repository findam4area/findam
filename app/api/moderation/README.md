# AI Content Moderation API

This directory contains API endpoints for AI-powered content moderation and admin review workflows.

## Requirements

- **Requirement 6.1**: Trigger AI moderation scans
- **Requirement 6.6**: Admin review workflow for flagged content

## Endpoints

### POST /api/moderation/scan-listing

Trigger a moderation scan for a listing.

**Task**: 10.1

**Request Body**:

```json
{
  "title": "Product Title",
  "description": "Product description",
  "price": 10000,
  "category": "electronics",
  "images": ["https://example.com/image1.jpg"],
  "listingId": "optional-listing-id"
}
```

**Response**:

```json
{
  "approved": false,
  "confidence": 75.5,
  "action": "flag",
  "violations": [
    {
      "type": "scam_indicators",
      "severity": "medium",
      "details": "Suspicious pricing detected",
      "confidence": 75
    }
  ],
  "shouldBlock": false,
  "reason": "Your listing has been flagged for review: Suspicious pricing detected"
}
```

**Actions**:

- `approve`: Confidence < 60% or no violations
- `flag`: Confidence 60-85% (manual review required)
- `reject`: Confidence > 85% (auto-reject)

---

### GET /api/moderation/queue

Return flagged listings for manual admin review.

**Task**: 10.2

**Query Parameters**:

- `status`: Filter by status (`pending`, `reviewed`, `all`) - default: `pending`
- `page`: Page number (0-indexed) - default: `0`
- `limit`: Items per page - default: `20`

**Example**:

```
GET /api/moderation/queue?status=pending&page=0&limit=20
```

**Response**:

```json
{
  "data": [
    {
      "moderation_id": "uuid",
      "listing_id": "uuid",
      "user_id": "uuid",
      "confidence_score": 75.5,
      "violations": [
        {
          "type": "scam_indicators",
          "severity": "medium",
          "details": "Suspicious pricing",
          "confidence": 75
        }
      ],
      "flagged_at": "2024-01-01T00:00:00Z",
      "listing_title": "Product Title",
      "listing_price": 10000,
      "category_id": "uuid",
      "seller_username": "username",
      "seller_email": "email@example.com"
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

**Authorization**: Admin role required

---

### POST /api/moderation/:id/review

Allow admin to approve or reject a flagged listing.

**Task**: 10.3

**Request Body**:

```json
{
  "decision": "approve",
  "notes": "Optional admin notes about the decision"
}
```

**Decision Values**:

- `approve`: Approve the listing (sets status to `active`)
- `reject`: Reject the listing (sets status to `rejected`)

**Response**:

```json
{
  "success": true,
  "message": "Listing approved successfully",
  "moderationId": "uuid",
  "decision": "approve"
}
```

**Authorization**: Admin role required

**Side Effects**:

- Updates `moderation_results` table with admin review
- Updates listing status based on decision
- TODO: Sends notification to seller

---

## Admin UI Component

### ModerationQueue Component

**Task**: 10.4

**Location**: `components/admin/moderation-queue.tsx`

**Features**:

- Display flagged listings with confidence scores
- Show violation details with severity badges
- Visual confidence score progress bars
- Admin notes input for review decisions
- Approve/Reject/View actions
- Pagination support
- Status filtering (pending/reviewed/all)
- Dual mode: AI moderation queue and user reports

**Usage**:

```tsx
import { ModerationQueue } from "@/components/admin/moderation-queue";

// AI Moderation Queue
<ModerationQueue mode="ai-moderation" />

// User Reports Queue
<ModerationQueue mode="reports" />
```

**Integrated in**: `components/admin/admin-dashboard.tsx`

---

## Database Schema

### moderation_results Table

Stores AI moderation scan results.

**Key Fields**:

- `id`: UUID primary key
- `listing_id`: Reference to listing (nullable)
- `user_id`: Reference to user
- `approved`: Boolean result
- `confidence_score`: 0-100 confidence score
- `action`: `approve`, `flag`, or `reject`
- `violations`: JSONB array of violation objects
- `admin_reviewed`: Boolean flag
- `admin_id`: Admin who reviewed (nullable)
- `admin_notes`: Admin review notes (nullable)
- `admin_decision`: `approve` or `reject` (nullable)
- `reviewed_at`: Timestamp of review (nullable)

### flagged_listings_queue View

Materialized view for efficient querying of flagged listings.

**Joins**:

- `moderation_results`
- `listings`
- `users`

**Filters**:

- Only shows listings with `action = 'flag'`
- Ordered by confidence score (DESC) and flagged date (ASC)

---

## Testing

### Unit Tests

- `app/api/moderation/scan-listing/__tests__/route.test.ts`
- `app/api/moderation/queue/__tests__/route.test.ts`
- `app/api/moderation/[id]/review/__tests__/route.test.ts`

### Manual Testing

1. **Scan a listing**:

```bash
curl -X POST http://localhost:3000/api/moderation/scan-listing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 15 Pro Max",
    "description": "Brand new, sealed. Contact me on WhatsApp for instant delivery!",
    "price": 50000,
    "category": "electronics"
  }'
```

2. **View moderation queue** (requires admin auth):

```bash
curl http://localhost:3000/api/moderation/queue?status=pending
```

3. **Review a flagged listing** (requires admin auth):

```bash
curl -X POST http://localhost:3000/api/moderation/{id}/review \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "approve",
    "notes": "Verified with seller, legitimate listing"
  }'
```

---

## Implementation Notes

### Confidence-Based Actions

The system uses confidence scores to determine automatic actions:

- **< 60%**: Auto-approve (low confidence in violation)
- **60-85%**: Flag for manual review (medium confidence)
- **> 85%**: Auto-reject (high confidence in violation)

### Violation Types

Common violation types detected:

- `prohibited_item`: Banned items
- `scam_indicators`: Suspicious patterns
- `inappropriate_content`: Policy violations
- `price_anomaly`: Unrealistic pricing
- `duplicate_listing`: Duplicate content
- `inappropriate_image`: Image content violations

### Security

- All endpoints require authentication
- Admin endpoints require `role = 'admin'`
- Row-level security (RLS) policies enforce access control
- Input validation on all endpoints

---

## Future Enhancements

- [ ] Automated seller notifications on review decisions
- [ ] Bulk review actions for admins
- [ ] Appeal workflow for rejected listings
- [ ] Machine learning model retraining based on admin decisions
- [ ] Moderation analytics dashboard
- [ ] Webhook notifications for moderation events
