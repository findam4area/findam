# Wallet API Endpoints

This directory contains the wallet management API endpoints for the FindAm marketplace.

## Endpoints

### GET /api/wallet

Returns the authenticated user's wallet balance and recent transactions.

**Requirements:** 5.1, 5.7

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "wallet": {
    "id": "uuid",
    "user_id": "uuid",
    "available_balance": 50000,
    "pending_balance": 0,
    "total_earned": 150000,
    "total_withdrawn": 100000,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T00:00:00Z"
  },
  "recent_transactions": [
    {
      "id": "uuid",
      "wallet_id": "uuid",
      "user_id": "uuid",
      "type": "credit",
      "amount": 25000,
      "fee": 625,
      "balance_after": 50000,
      "description": "Escrow release",
      "category": "escrow_release",
      "status": "completed",
      "reference": "escrow_transaction_id",
      "created_at": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### POST /api/wallet/withdraw

Creates a withdrawal request to transfer funds to a bank account.

**Requirements:** 5.3

**Authentication:** Required

**Request Body:**

```json
{
  "amount": 10000,
  "bank_code": "058",
  "account_number": "0123456789",
  "account_name": "John Doe"
}
```

**Validation:**

- `amount`: Must be positive, minimum ₦100
- `bank_code`: Required, valid Nigerian bank code
- `account_number`: Must be exactly 10 digits
- `account_name`: Required

**Response:**

```json
{
  "success": true,
  "withdrawal": {
    "id": "uuid",
    "wallet_id": "uuid",
    "user_id": "uuid",
    "amount": 10000,
    "fee": 100,
    "net_amount": 9900,
    "bank_code": "058",
    "account_number": "0123456789",
    "account_name": "John Doe",
    "status": "processing",
    "requires_verification": false,
    "created_at": "2024-01-15T00:00:00Z"
  },
  "message": "Withdrawal request submitted successfully. Processing will complete within 24 hours."
}
```

**Fee Structure:**

- ₦100 for amounts below ₦10,000
- ₦50 for amounts between ₦10,000 and ₦20,000
- ₦0 (free) for amounts ₦20,000 and above

**Additional Verification:**

- Withdrawals exceeding ₦100,000 require additional verification
- Status will be "pending" instead of "processing"

### GET /api/wallet/transactions

Returns paginated transaction history with optional category filtering.

**Requirements:** 5.7

**Authentication:** Required

**Query Parameters:**

- `category` (optional): Filter by transaction category
  - Valid values: `escrow_release`, `withdrawal`, `refund`, `purchase`, `fee`, `adjustment`, `referral`, `bonus`
- `limit` (optional): Number of transactions to return (default: 50, max: 100)
- `offset` (optional): Number of transactions to skip (default: 0)

**Example Request:**

```
GET /api/wallet/transactions?category=escrow_release&limit=20&offset=0
```

**Response:**

```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "wallet_id": "uuid",
      "user_id": "uuid",
      "type": "credit",
      "amount": 25000,
      "fee": 625,
      "balance_after": 50000,
      "description": "Escrow release",
      "category": "escrow_release",
      "status": "completed",
      "reference": "escrow_transaction_id",
      "metadata": null,
      "created_at": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "count": 15
  }
}
```

## Error Responses

All endpoints return standard error responses:

**401 Unauthorized:**

```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request:**

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 100,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Minimum withdrawal amount is ₦100",
      "path": ["amount"]
    }
  ]
}
```

**500 Internal Server Error:**

```json
{
  "error": "Failed to process withdrawal request"
}
```

## Related Services

- `lib/services/wallet.ts` - WalletService implementation
- `lib/services/escrow.ts` - EscrowService (for escrow-related wallet operations)

## Testing

To test these endpoints, you need:

1. A valid authentication token (Supabase session)
2. A user account with a wallet
3. For withdrawals: Valid Nigerian bank account details

Example using curl:

```bash
# Get wallet balance
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN"

# Request withdrawal
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "bank_code": "058",
    "account_number": "0123456789",
    "account_name": "John Doe"
  }'

# Get transactions
curl -X GET "http://localhost:3000/api/wallet/transactions?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
