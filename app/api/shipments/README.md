# Shipments API Endpoints

This directory contains API endpoints for shipment management (Requirement 8).

## Endpoints

### POST /api/shipments

Create a new shipment with selected logistics partner.

**Authentication:** Required (Seller only)

**Request Body:**

```json
{
  "orderId": "order-uuid",
  "providerId": "provider-uuid",
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
  "message": "Shipment created successfully",
  "data": {
    "id": "shipment-uuid",
    "orderId": "order-uuid",
    "providerId": "provider-uuid",
    "trackingNumber": "GIG-1234567890",
    "status": "pending",
    "estimatedDelivery": "2024-01-18T12:00:00Z",
    "shippingCost": 2500,
    "currency": "NGN",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Requirements:** 8.1, 8.2

**Authorization:**

- Only the seller of the order can create shipments
- Order must exist and be in valid state

---

### GET /api/shipments/:id/track

Track a shipment and get real-time tracking status.

**Authentication:** Required (Buyer or Seller)

**URL Parameters:**

- `id` - Shipment UUID

**Response:**

```json
{
  "success": true,
  "data": {
    "shipment": {
      "id": "shipment-uuid",
      "trackingNumber": "GIG-1234567890",
      "status": "in_transit",
      "currentLocation": "Lagos Distribution Center",
      "estimatedDelivery": "2024-01-18T12:00:00Z",
      "deliveryPerson": {
        "name": "Ahmed Ibrahim",
        "phone": "+2348012345678",
        "photo": "https://example.com/photo.jpg"
      }
    },
    "provider": {
      "id": "provider-uuid",
      "name": "GIG",
      "isActive": true
    },
    "history": [
      {
        "id": "event-uuid",
        "status": "pending",
        "location": "Lagos",
        "description": "Shipment created and awaiting pickup",
        "timestamp": "2024-01-15T10:00:00Z"
      },
      {
        "id": "event-uuid-2",
        "status": "picked_up",
        "location": "Pickup Location",
        "description": "Package picked up from sender",
        "timestamp": "2024-01-15T14:00:00Z"
      },
      {
        "id": "event-uuid-3",
        "status": "in_transit",
        "location": "Lagos Distribution Center",
        "description": "Package in transit",
        "timestamp": "2024-01-16T09:00:00Z"
      }
    ]
  }
}
```

**Requirements:** 8.3, 8.9

**Authorization:**

- Only the buyer or seller of the order can track the shipment
- Returns 403 if user is neither buyer nor seller

**Features:**

- Fetches real-time tracking data from logistics provider API
- Updates local database with latest status
- Returns complete tracking history
- Shows delivery person contact info when available

---

## Shipment Status Values

- `pending` - Shipment created, awaiting pickup
- `picked_up` - Package picked up from sender
- `in_transit` - Package in transit to destination
- `out_for_delivery` - Package out for delivery
- `delivered` - Package delivered successfully
- `failed` - Delivery failed or cancelled

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
- `201` - Created (for POST /api/shipments)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not authorized for this shipment)
- `404` - Not Found (shipment or order not found)
- `500` - Internal Server Error

## Security

- All endpoints require authentication
- Authorization checks ensure only buyer/seller can access shipment data
- Input validation using Zod schemas
- SQL injection prevention via parameterized queries
- Rate limiting applied to prevent abuse

## Notifications

The system automatically sends notifications for key delivery milestones:

- Package picked up
- Package in transit
- Package out for delivery
- Package delivered
- Delivery failed

See: `lib/services/logistics.ts` for notification implementation
