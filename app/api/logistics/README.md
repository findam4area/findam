# Logistics API Endpoints

This directory contains API endpoints for integrated logistics and tracking functionality (Requirement 8).

## Endpoints

### GET/POST /api/logistics/quotes

Get shipping quotes from all integrated logistics partners.

**Supported Partners:**

- GIG
- Kwik
- Sendbox
- Gokada
- Redbox
- Bolt

**Request Body (POST) / Query Parameters (GET):**

```json
{
  "pickupAddress": {
    "street": "123 Main St",
    "city": "Lagos",
    "state": "Lagos",
    "postalCode": "100001",
    "country": "Nigeria",
    "contactName": "John Doe",
    "contactPhone": "+2348012345678"
  },
  "deliveryAddress": {
    "street": "456 Oak Ave",
    "city": "Abuja",
    "state": "FCT",
    "country": "Nigeria",
    "contactName": "Jane Smith",
    "contactPhone": "+2348087654321"
  },
  "packageDetails": {
    "weight": 2.5,
    "dimensions": {
      "length": 30,
      "width": 20,
      "height": 15
    },
    "value": 50000,
    "description": "Electronics"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "quote-uuid",
      "providerId": "provider-uuid",
      "providerName": "GIG",
      "quotedPrice": 2500,
      "estimatedDeliveryTime": "2-3 days",
      "currency": "NGN",
      "validUntil": "2024-01-15T12:00:00Z"
    }
  ]
}
```

**Requirements:** 8.10

---

## Related Endpoints

### POST /api/shipments

Create a new shipment with selected logistics partner.

See: `app/api/shipments/README.md`

**Requirements:** 8.1, 8.2

### GET /api/shipments/:id/track

Track a shipment and get real-time status.

See: `app/api/shipments/README.md`

**Requirements:** 8.3, 8.9

### POST /api/webhooks/logistics/:partner

Handle webhook updates from logistics partners.

See: `app/api/webhooks/logistics/README.md`

**Requirements:** 8.3, 8.4

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional validation errors
}
```

**Common Status Codes:**

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security

- All endpoints validate input using Zod schemas
- Authentication required for shipment creation and tracking
- Webhook signatures verified in production
- Rate limiting applied to prevent abuse
