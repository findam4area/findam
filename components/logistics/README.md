# Logistics Components

This directory contains UI components for the integrated logistics and tracking system (Requirement 8).

## Components

### LogisticsSelector

**Task 30.1** - Display all partner options with cost comparison

**Requirements:** 8.1, 8.10

Displays available logistics partners with their shipping quotes, allowing users to compare costs and delivery times.

**Features:**

- Fetches quotes from all 6 logistics partners (GIG, Kwik, Sendbox, Gokada, Redbox, Bolt)
- Side-by-side cost comparison
- Highlights the cheapest option
- Shows estimated delivery time for each partner
- Mobile-responsive grid layout

**Usage:**

```tsx
import { LogisticsSelector } from "@/components/logistics";

<LogisticsSelector
  orderId="order-123"
  quoteRequest={{
    pickupAddress: {...},
    deliveryAddress: {...},
    packageDetails: {...}
  }}
  onSelect={(quote) => console.log("Selected:", quote)}
  selectedQuoteId={selectedId}
/>
```

### TrackingDashboard

**Task 30.3** - Display real-time tracking status and estimated delivery time

**Requirements:** 8.3, 8.5, 8.6, 8.8

Main tracking interface showing current shipment status, location, and delivery information.

**Features:**

- Real-time status updates (polls every 30 seconds)
- Current location display
- Estimated delivery time
- Delivery person contact info (when out for delivery)
- Delivery failure notifications
- Pickup and delivery addresses
- Manual refresh button

**Usage:**

```tsx
import { TrackingDashboard } from "@/components/logistics";

<TrackingDashboard
  shipmentId="shipment-123"
  onRefresh={() => console.log("Refreshed")}
/>;
```

### DeliveryTimeline

**Task 30.5** - Visual delivery progress display

**Requirements:** 8.3

Visual timeline showing delivery progress through all stages.

**Features:**

- Step-by-step progress visualization
- Completed, current, and upcoming steps
- Event history with timestamps and locations
- Expandable full history
- Failed delivery indication
- Animated current step

**Usage:**

```tsx
import { DeliveryTimeline } from "@/components/logistics";

<DeliveryTimeline currentStatus="in_transit" history={trackingEvents} />;
```

### DeliveryRating

**Task 30.10** - Allow buyers to rate delivery experience

**Requirements:** 8.7

Separate rating system for delivery experience (independent of product rating).

**Features:**

- 5-star rating system
- Optional text review (500 characters max)
- Read-only mode for existing ratings
- Success/error feedback
- Accessible star buttons with keyboard support

**Usage:**

```tsx
import { DeliveryRating } from "@/components/logistics";

// For new rating
<DeliveryRating
  shipmentId="shipment-123"
  providerName="GIG"
  onRatingSubmitted={() => console.log("Rating submitted")}
/>

// For existing rating (read-only)
<DeliveryRating
  shipmentId="shipment-123"
  providerName="GIG"
  existingRating={4}
  existingReview="Great service!"
/>
```

### TrackingPage

Comprehensive tracking page combining all logistics components.

**Features:**

- Combines TrackingDashboard, DeliveryTimeline, and DeliveryRating
- Automatic data fetching and refresh
- Shows rating component only when delivered and not yet rated
- Displays existing rating if already submitted

**Usage:**

```tsx
import { TrackingPage } from "@/components/logistics";

<TrackingPage shipmentId="shipment-123" />;
```

## Delivery Milestone Notifications

**Task 30.6** - Send push notifications for delivery milestones

**Requirements:** 8.4

Notifications are automatically sent by the LogisticsService when shipment status changes:

- **picked_up**: "Your package has been picked up"
- **in_transit**: "Your package is on its way"
- **out_for_delivery**: "Your package is out for delivery"
- **delivered**: "Your package has been delivered"
- **failed**: "Delivery attempt failed"

Notifications are sent to:

- Buyer: All milestone updates
- Seller: Delivered and failed status updates

## Delivery Failure Notifications

**Task 30.9** - Notify both parties on delivery failure

**Requirements:** 8.8

When a shipment status is updated to "failed":

- Both buyer and seller receive notifications
- Failure reason is displayed in the tracking dashboard
- Failure timestamp is recorded

## API Integration

All components integrate with the following API endpoints:

- `POST /api/logistics/quotes` - Get shipping quotes from all providers
- `GET /api/logistics/track/:shipmentId` - Get tracking information
- `POST /api/logistics/rate` - Submit delivery rating

## Accessibility

All components follow WCAG 2.1 AA standards:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support
- Focus management

## Mobile Responsiveness

All components are mobile-first and responsive:

- LogisticsSelector: Grid layout adapts to screen size
- TrackingDashboard: Stacked cards on mobile
- DeliveryTimeline: Vertical timeline optimized for mobile
- DeliveryRating: Full-width on mobile

## Testing

Components can be tested with mock data:

```tsx
const mockQuoteRequest = {
  pickupAddress: {
    street: "123 Main St",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    contactName: "John Doe",
    contactPhone: "+234 123 456 7890",
  },
  deliveryAddress: {
    street: "456 Oak Ave",
    city: "Abuja",
    state: "FCT",
    country: "Nigeria",
    contactName: "Jane Smith",
    contactPhone: "+234 098 765 4321",
  },
  packageDetails: {
    weight: 2.5,
    dimensions: { length: 30, width: 20, height: 10 },
    value: 50000,
    description: "Electronics",
  },
};
```

## Notes

- The LogisticsService handles all backend logic including API calls to logistics partners
- Notifications are sent automatically via Supabase when shipment status changes
- Real-time updates use polling (30-second intervals) in the TrackingDashboard
- All monetary values are in Nigerian Naira (NGN)
