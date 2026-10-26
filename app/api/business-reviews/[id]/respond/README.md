# Business Review Response Endpoint

## Task 8.3: POST /api/business-reviews/[id]/respond

This endpoint allows business owners to respond to reviews left on their business profiles.

### Requirements
- **Requirement 11.6**: Allow business owners to respond to reviews with a single response per review

### Endpoint Details

**URL**: `POST /api/business-reviews/[id]/respond`

**Parameters**:
- `id` (path): The UUID of the business review

**Request Body**:
```json
{
  "response": "Thank you for your feedback! We appreciate your business."
}
```

**Validations**:
- Response text must be between 1 and 1000 characters
- User must be authenticated
- User must own the business that was reviewed
- Review must exist
- Review must not already have a response (one response per review limit)

### Success Response

**Status**: 200 OK

```json
{
  "review": {
    "id": "uuid",
    "business_profile_id": "uuid",
    "reviewer_id": "uuid",
    "rating": 5,
    "comment": "Great service!",
    "owner_response": "Thank you for your feedback! We appreciate your business.",
    "responded_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "reviewer": {
      "id": "uuid",
      "full_name": "John Doe",
      "username": "johndoe",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "business_profile": {
      "id": "uuid",
      "business_name": "My Business"
    }
  },
  "message": "Response added successfully"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized. Please sign in to respond to reviews."
}
```

#### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": [
    {
      "field": "response",
      "message": "Response must be at most 1000 characters"
    }
  ]
}
```

#### 403 Forbidden
```json
{
  "error": "Only the business owner can respond to this review"
}
```

#### 404 Not Found
```json
{
  "error": "Review not found"
}
```

#### 409 Conflict
```json
{
  "error": "This review already has a response. Only one response per review is allowed.",
  "existing_response": {
    "owner_response": "Previous response text",
    "responded_at": "2024-01-15T09:00:00Z"
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to add response to review"
}
```

## Manual Testing

### Test Case 1: Successful Response

1. Create a business profile as User A
2. Create a review for that business as User B
3. Sign in as User A (business owner)
4. Send POST request to `/api/business-reviews/[review-id]/respond` with:
   ```json
   {
     "response": "Thank you for your feedback!"
   }
   ```
5. **Expected**: 200 OK with updated review including `owner_response` and `responded_at`

### Test Case 2: Duplicate Response Prevention

1. Follow steps 1-4 from Test Case 1
2. Attempt to send another POST request with a different response
3. **Expected**: 409 Conflict error

### Test Case 3: Unauthorized Response

1. Create a business profile as User A
2. Create a review as User B
3. Sign in as User C (different user)
4. Attempt to respond to the review
5. **Expected**: 403 Forbidden error

### Test Case 4: Invalid Response Length

1. Send POST request with response text exceeding 1000 characters
2. **Expected**: 400 Bad Request with validation error

### Test Case 5: Non-existent Review

1. Send POST request to a non-existent review ID
2. **Expected**: 404 Not Found error

## Database Schema

The endpoint updates the `business_reviews` table:

```sql
CREATE TABLE business_reviews (
  id UUID PRIMARY KEY,
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (length(comment) BETWEEN 10 AND 1000),
  owner_response TEXT CHECK (owner_response IS NULL OR length(owner_response) <= 1000),
  responded_at TIMESTAMPTZ,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Details

- Uses `businessOwnerResponseSchema` from `@/lib/validations/review` for request validation
- Sanitizes user content to prevent XSS attacks
- Creates a notification for the reviewer when business owner responds
- Verifies business ownership through the `business_profiles.user_id` field
- Single-response enforcement checked before updating database

## Related Files

- **Validation**: `lib/validations/review.ts`
- **Route Handler**: `app/api/business-reviews/[id]/respond/route.ts`
- **Test File**: `app/api/business-reviews/[id]/respond/route.test.ts`
- **Database Schema**: `supabase/migrations/043_business_profile_related_tables.sql`
