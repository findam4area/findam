# Escrow API Endpoints

This directory contains the escrow payment system API endpoints for the FindAm marketplace.

## Endpoints

### POST /api/escrow/initialize

Creates an escrow transaction and returns a Paystack payment URL.

**Requirements:** 4.1, 4.9

**Authentication:** Required

**Request Body:**

```json
{
  "listing_id": "uuid",
  "seller_id": "uuid",
  "amount": 50000,
  "estimated_delivery_date": "2024-02-01T00:00:00Z",
  "callback_url": "https://findamng.com/payments/callback"
}
```

**Validation:**

- `listing_id`: Must be a valid UUID
- `seller_id`: Must be a valid UUID and match the listing's seller
- `amount`: Must be positive
- `estimated_delivery_date` (optional): ISO 8601 date string
- `callback_url` (optional): Valid URL for payment redirect

**Response:**

```json
{
  "success": true,
  "escrow_transaction_id": "uuid",
  "payment_url": "https://checkout.paystack.com/...",
  "reference": "escrow_1234567890_abcd1234"
}
```

**Business Logic:**

- Validates listing exists and is active
- Validates seller_id matches listing
- Calculates 2.5% escrow fee
- Creates escrow transaction with "pending" status
- Initializes Paystack payment
- Sets auto-release date to 7 days after estimated delivery

### POST /api/escrow/verify

Verifies Paystack payment and updates escrow status to "held".

**Requirements:** 4.1, 4.2

**Authentication:** Required

**Request Body:**

```json
{
  "reference": "escrow_1234567890_abcd1234"
}
```

**Response:**

```json
{
  "success": true,
  "escrow_transaction": {
    "id": "uuid",
    "listing_id": "uuid",
    "buyer_id": "uuid",
    "seller_id": "uuid",
    "amount": 50000,
    "fee": 1250,
    "status": "held",
    "paystack_reference": "escrow_1234567890_abcd1234",
    "estimated_delivery_date": "2024-02-01T00:00:00Z",
    "auto_release_at": "2024-02-08T00:00:00Z",
    "created_at": "2024-01-15T00:00:00Z"
  }
}
```

**Business Logic:**

- Verifies payment with Paystack API
- Updates escrow status from "pending" to "held"
- Notifies seller that payment is secured

### GET /api/escrow/:id

Retrieves escrow transaction details.

**Authentication:** Required

**Authorization:** User must be buyer or seller of the transaction

**Response:**

```json
{
  "success": true,
  "escrow_transaction": {
    "id": "uuid",
    "listing_id": "uuid",
    "buyer_id": "uuid",
    "seller_id": "uuid",
    "amount": 50000,
    "fee": 1250,
    "status": "held",
    "paystack_reference": "escrow_1234567890_abcd1234",
    "estimated_delivery_date": "2024-02-01T00:00:00Z",
    "auto_release_at": "2024-02-08T00:00:00Z",
    "created_at": "2024-01-15T00:00:00Z",
    "released_at": null,
    "dispute_reason": null,
    "dispute_evidence": null
  }
}
```

### POST /api/escrow/:id/confirm-delivery

Confirms delivery and releases funds to seller wallet within 24 hours.

**Requirements:** 4.3, 4.10

**Authentication:** Required

**Authorization:** Only the buyer can confirm delivery

**Request Body:**

```json
{
  "rating": 5,
  "review": "Great product, fast delivery!"
}
```

**Validation:**

- `rating` (optional): Integer between 1 and 5
- `review` (optional): String, max 1000 characters

**Response:**

```json
{
  "success": true,
  "escrow_transaction": {
    "id": "uuid",
    "status": "released",
    "released_at": "2024-01-20T00:00:00Z"
  },
  "released": true,
  "message": "Delivery confirmed and funds released to seller"
}
```

**Business Logic:**

- Validates buyer is the transaction buyer
- Validates escrow status is "held"
- Updates status to "released"
- Credits seller wallet with (amount - fee)
- Creates wallet transaction record
- Sends notifications to both parties

### POST /api/escrow/:id/dispute

Disputes a transaction and freezes funds with "disputed" status.

**Requirements:** 4.5

**Authentication:** Required

**Authorization:** Only the buyer can dispute

**Request Body:**

```json
{
  "reason": "Item not as described. The phone has scratches that were not mentioned in the listing.",
  "evidence": {
    "images": ["url1", "url2"],
    "description": "Additional details about the issue"
  }
}
```

**Validation:**

- `reason`: Required, min 10 characters, max 1000 characters
- `evidence` (optional): Object with any additional evidence

**Response:**

```json
{
  "success": true,
  "escrow_transaction": {
    "id": "uuid",
    "status": "disputed",
    "dispute_reason": "Item not as described...",
    "dispute_evidence": {
      "images": ["url1", "url2"],
      "description": "Additional details..."
    }
  },
  "message": "Transaction disputed successfully. Funds are frozen pending resolution."
}
```

**Business Logic:**

- Validates buyer is the transaction buyer
- Validates escrow status is "held"
- Updates status to "disputed"
- Freezes funds (no release)
- Stores dispute reason and evidence
- Notifies both parties and admin

### GET /api/escrow

Lists escrow transactions for the authenticated user.

**Authentication:** Required

**Query Parameters:**

- `role` (optional): Filter by user role - "buyer" or "seller"
- `status` (optional): Filter by transaction status - "pending", "held", "released", "refunded", "disputed"
- `limit` (optional): Number of transactions to return (default: 50)
- `offset` (optional): Number of transactions to skip (default: 0)

**Example Request:**

```
GET /api/escrow?role=seller&status=held&limit=20
```

**Response:**

```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "listing_id": "uuid",
      "buyer_id": "uuid",
      "seller_id": "uuid",
      "amount": 50000,
      "fee": 1250,
      "status": "held",
      "created_at": "2024-01-15T00:00:00Z"
    }
  ],
  "count": 15
}
```

## Escrow Status Flow

```
pending → held → released
              ↓
           disputed
```

1. **pending**: Payment initiated but not yet confirmed
2. **held**: Payment confirmed, funds held in escrow
3. **released**: Buyer confirmed delivery, funds released to seller
4. **disputed**: Buyer raised a dispute, funds frozen
5. **refunded**: Dispute resolved in buyer's favor, funds returned

## Auto-Release Mechanism

- If buyer doesn't confirm delivery within 7 days of estimated delivery date
- Funds automatically release to seller
- Implemented via cron job at `/api/cron/auto-release-escrow`

## Fee Structure

- **Escrow Fee:** 2.5% of transaction amount
- Deducted from seller's payout
- Example: ₦50,000 transaction → ₦1,250 fee → ₦48,750 to seller

## Error Responses

**401 Unauthorized:**

```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**

```json
{
  "error": "Forbidden"
}
```

**404 Not Found:**

```json
{
  "error": "Transaction not found"
}
```

**400 Bad Request:**

```json
{
  "error": "Invalid request data",
  "details": [...]
}
```

**500 Internal Server Error:**

```json
{
  "error": "Failed to initialize escrow"
}
```

## Related Services

- `lib/services/escrow.ts` - EscrowService implementation
- `lib/services/wallet.ts` - WalletService (for fund releases)
- `lib/paystack/client.ts` - Paystack integration

## Testing

Example using curl:

```bash
# Initialize escrow
curl -X POST http://localhost:3000/api/escrow/initialize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "uuid",
    "seller_id": "uuid",
    "amount": 50000
  }'

# Verify payment
curl -X POST http://localhost:3000/api/escrow/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "escrow_1234567890_abcd1234"
  }'

# Confirm delivery
curl -X POST http://localhost:3000/api/escrow/uuid/confirm-delivery \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "review": "Great product!"
  }'

# Dispute transaction
curl -X POST http://localhost:3000/api/escrow/uuid/dispute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Item not as described"
  }'

# List transactions
curl -X GET "http://localhost:3000/api/escrow?role=buyer" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
