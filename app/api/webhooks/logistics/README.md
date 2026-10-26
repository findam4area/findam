# Logistics Webhooks API

This directory contains webhook endpoints for receiving real-time updates from logistics partners (Requirement 8.3, 8.4).

## Endpoint

### POST /api/webhooks/logistics/:partner

Handle webhook updates from logistics partners.

**URL Parameters:**

- `partner` - Logistics partner name (GIG, Kwik, Sendbox, Gokada, Redbox, Bolt)

**Headers:**

- `x-webhook-signature` - HMAC SHA256 signature for verification (required in production)

**Request Body:**

```json
{
  "trackingNumber": "GIG-1234567890",
  "status": "in_transit",
  "location": "Lagos Distribution Center",
  "description": "Package in transit to destination",
  "timestamp": "2024-01-16T09:00:00Z",
  "deliveryPerson": {
    "name": "Ahmed Ibrahim",
    "phone": "+2348012345678",
    "photo": "https://example.com/photo.jpg"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "shipmentId": "shipment-uuid"
}
```

**Requirements:** 8.3, 8.4

---

## Supported Partners

The endpoint supports webhooks from the following logistics partners:

1. **GIG** - GIG Logistics
2. **Kwik** - Kwik Delivery
3. **Sendbox** - Sendbox Logistics
4. **Gokada** - Gokada Delivery
5. **Redbox** - Redbox Logistics
6. **Bolt** - Bolt Delivery

## Webhook Security

### Signature Verification

All webhooks are verified using HMAC SHA256 signatures in production:

1. Partner sends webhook with `x-webhook-signature` header
2. Server generates expected signature using partner's secret key
3. Signatures are compared using timing-safe comparison
4. Request rejected if signatures don't match

### Environment Variables

Configure webhook secrets for each partner:

```env
GIG_WEBHOOK_SECRET=your_gig_secret_key
KWIK_WEBHOOK_SECRET=your_kwik_secret_key
SENDBOX_WEBHOOK_SECRET=your_sendbox_secret_key
GOKADA_WEBHOOK_SECRET=your_gokada_secret_key
REDBOX_WEBHOOK_SECRET=your_redbox_secret_key
BOLT_WEBHOOK_SECRET=your_bolt_secret_key
```

**Note:** Signature verification is skipped in development mode for testing.

---

## Status Mapping

The endpoint maps provider-specific status values to our standard status:

| Provider Status                     | Standard Status  |
| ----------------------------------- | ---------------- |
| pending                             | pending          |
| picked up / picked_up               | picked_up        |
| in transit / in_transit             | in_transit       |
| out for delivery / out_for_delivery | out_for_delivery |
| delivered                           | delivered        |
| failed / cancelled / returned       | failed           |

---

## Webhook Processing Flow

1. **Validate Partner** - Ensure partner is supported
2. **Verify Signature** - Check webhook authenticity (production only)
3. **Parse Payload** - Validate webhook data structure
4. **Find Shipment** - Lookup shipment by tracking number
5. **Verify Provider** - Ensure webhook is from correct provider
6. **Update Status** - Update shipment status in database
7. **Add Tracking Event** - Create new tracking event
8. **Send Notifications** - Notify buyer/seller of status change
9. **Return Success** - Acknowledge webhook receipt

---

## Automatic Notifications

When a webhook updates shipment status, the system automatically sends notifications for these milestones:

- **picked_up** - "Your package has been picked up"
- **in_transit** - "Your package is on its way"
- **out_for_delivery** - "Your package is out for delivery"
- **delivered** - "Your package has been delivered"
- **failed** - "Delivery attempt failed"

Notifications are sent to:

- **Buyer** - All status updates
- **Seller** - Delivered and failed statuses

See: `lib/services/logistics.ts` for notification implementation

---

## Error Handling

**Common Error Responses:**

```json
{
  "success": false,
  "error": "Unsupported logistics partner: InvalidPartner"
}
```

```json
{
  "success": false,
  "error": "Invalid webhook signature"
}
```

```json
{
  "success": false,
  "error": "Shipment not found for tracking number: GIG-1234567890"
}
```

```json
{
  "success": false,
  "error": "Webhook partner mismatch. Expected GIG, got Kwik"
}
```

**Status Codes:**

- `200` - Success
- `400` - Bad Request (invalid partner, validation error, partner mismatch)
- `401` - Unauthorized (invalid signature)
- `404` - Not Found (shipment not found)
- `500` - Internal Server Error

---

## Testing Webhooks

### Development Mode

In development, signature verification is disabled. You can test webhooks using curl:

```bash
curl -X POST http://localhost:3000/api/webhooks/logistics/GIG \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "GIG-1234567890",
    "status": "in_transit",
    "location": "Lagos Distribution Center",
    "description": "Package in transit",
    "timestamp": "2024-01-16T09:00:00Z"
  }'
```

### Production Mode

In production, include the signature header:

```bash
curl -X POST https://findamng.com/api/webhooks/logistics/GIG \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: your_hmac_signature" \
  -d '{
    "trackingNumber": "GIG-1234567890",
    "status": "delivered",
    "location": "Delivery Address",
    "description": "Package delivered successfully"
  }'
```

---

## Integration Guide

### For Logistics Partners

To integrate your logistics service with FindAm:

1. **Contact Us** - Reach out to get your webhook secret key
2. **Configure Webhook URL** - Set `https://findamng.com/api/webhooks/logistics/[YourPartnerName]`
3. **Send Status Updates** - POST webhook data when shipment status changes
4. **Include Signature** - Add `x-webhook-signature` header with HMAC SHA256 signature
5. **Handle Responses** - Check for success/error responses and retry on failure

### Webhook Payload Requirements

- `trackingNumber` - Required, string
- `status` - Required, string (see status mapping)
- `location` - Optional, string (current location)
- `description` - Required, string (status description)
- `timestamp` - Optional, ISO 8601 datetime
- `deliveryPerson` - Optional, object with name, phone, photo

---

## Monitoring

The endpoint logs all webhook processing:

- Successful webhook processing
- Signature verification failures
- Shipment not found errors
- Partner mismatch errors
- General processing errors

Check application logs for webhook activity and troubleshooting.
