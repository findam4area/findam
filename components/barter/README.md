# Barter and Exchange System Components

This directory contains components for the barter and exchange system, allowing users to propose item exchanges without monetary transactions.

## Requirements

Implements Requirements 12.1-12.10 from the FindAm Marketplace Enhancements specification.

## Components

### BarterProposalForm

Form component for creating exchange proposals.

**Features:**

- Selection of offered listing from user's active listings
- Automatic value difference calculation (Requirement 12.9)
- Cash adjustment input for partial exchanges (Requirement 12.10)
- Message field for proposal context
- Real-time validation

**Props:**

```typescript
interface BarterProposalFormProps {
  targetListingId: string;
  targetListingTitle: string;
  targetListingPrice: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**Usage:**

```tsx
<BarterProposalForm
  targetListingId="listing-123"
  targetListingTitle="iPhone 13 Pro"
  targetListingPrice={450000}
  onSuccess={() => router.push("/proposals")}
  onCancel={() => setShowForm(false)}
/>
```

### BarterNegotiationThread

Dedicated messaging interface for exchange negotiations (Requirement 12.7).

**Features:**

- Real-time messaging with Supabase Realtime
- Proposal summary display
- Value comparison
- Status-based message restrictions
- Auto-scroll to latest messages

**Props:**

```typescript
interface BarterNegotiationThreadProps {
  proposalId: string;
  currentUserId: string;
}
```

**Usage:**

```tsx
<BarterNegotiationThread proposalId="proposal-456" currentUserId={user.id} />
```

### ValueCalculator

Shows estimated value comparison between items (Requirement 12.9).

**Features:**

- Side-by-side item comparison
- Value difference calculation
- Percentage difference display
- Cash adjustment impact
- Exchange fairness indicator

**Props:**

```typescript
interface ValueCalculatorProps {
  item1: {
    title: string;
    price: number;
    image?: string;
  };
  item2: {
    title: string;
    price: number;
    image?: string;
  };
  cashAdjustment?: number;
  className?: string;
}
```

**Usage:**

```tsx
<ValueCalculator
  item1={{
    title: "Samsung Galaxy S21",
    price: 300000,
    image: "/images/samsung.jpg",
  }}
  item2={{
    title: "iPhone 12",
    price: 350000,
    image: "/images/iphone.jpg",
  }}
  cashAdjustment={25000}
/>
```

### ExchangeBadge

Displays "Open to Exchange" badge on listings (Requirements 12.1, 12.2).

**Features:**

- Two variants: default and compact
- Consistent styling with platform theme
- Accessible with proper ARIA labels

**Props:**

```typescript
interface ExchangeBadgeProps {
  variant?: "default" | "compact";
  className?: string;
}
```

**Usage:**

```tsx
// On listing cards
<ExchangeBadge variant="compact" />

// On listing detail pages
<ExchangeBadge variant="default" />
```

## Service Layer

### BarterService

Located at `lib/services/barter.ts`, handles all barter-related business logic.

**Methods:**

#### createProposal

Creates a new barter proposal (Requirements 12.3, 12.4).

```typescript
await barterService.createProposal({
  targetListingId: "listing-123",
  offeredListingId: "listing-456",
  proposerId: user.id,
  message: "Would you be interested in this exchange?",
  cashAdjustment: 10000,
});
```

#### acceptProposal

Accepts a barter proposal (Requirements 12.5, 12.6).

```typescript
await barterService.acceptProposal(proposalId, userId);
```

#### rejectProposal

Rejects a barter proposal (Requirement 12.5).

```typescript
await barterService.rejectProposal(proposalId, userId);
```

#### counterProposal

Creates a counter-proposal (Requirement 12.5).

```typescript
await barterService.counterProposal(
  originalProposalId,
  userId,
  newCashAdjustment,
  "How about this instead?",
);
```

#### getUserProposals

Retrieves user's proposals (received or sent).

```typescript
const { proposals } = await barterService.getUserProposals(userId, "received");
```

## API Endpoints

### POST /api/barter/proposals

Create a new barter proposal.

**Request:**

```json
{
  "targetListingId": "listing-123",
  "offeredListingId": "listing-456",
  "message": "Optional message",
  "cashAdjustment": 10000
}
```

### GET /api/barter/proposals

Get user's proposals.

**Query params:**

- `type`: 'received' | 'sent' (default: 'received')

### GET /api/barter/proposals/[id]

Get a specific proposal by ID.

### PATCH /api/barter/proposals/[id]

Accept, reject, or counter a proposal.

**Request:**

```json
{
  "action": "accept" | "reject" | "counter",
  "cashAdjustment": 15000,  // Required for counter
  "message": "Optional message for counter"
}
```

### GET /api/barter/preferences

Get user's barter preferences.

**Query params:**

- `listingId`: Filter by specific listing (optional)

### POST /api/barter/preferences

Create or update barter preferences.

**Request:**

```json
{
  "listingId": "listing-123",
  "openToExchange": true,
  "preferredCategories": ["electronics", "phones"],
  "minValue": 100000,
  "maxValue": 500000
}
```

### DELETE /api/barter/preferences

Remove barter preferences for a listing.

**Query params:**

- `listingId`: Required

## Database Schema

### barter_proposals

Stores barter/exchange proposals between users.

**Key fields:**

- `target_listing_id`: Listing being requested
- `offered_listing_id`: Listing being offered
- `proposer_id`: User making the proposal
- `receiver_id`: User receiving the proposal
- `value_difference`: Calculated price difference
- `cash_adjustment`: Optional cash to balance exchange
- `status`: pending | accepted | rejected | countered | expired
- `expires_at`: Proposal expiration (7 days)

### barter_preferences

Stores user preferences for barter exchanges.

**Key fields:**

- `listing_id`: Listing with exchange preferences
- `open_to_exchange`: Whether listing accepts exchanges
- `preferred_categories`: Array of acceptable categories
- `min_value`: Minimum acceptable value
- `max_value`: Maximum acceptable value

### barter_messages

Stores messages exchanged during negotiations.

**Key fields:**

- `proposal_id`: Reference to proposal
- `sender_id`: Message sender
- `content`: Message text (max 500 chars)

## Notifications

The system creates notifications for:

- New proposals (Requirement 12.4)
- Accepted proposals
- Rejected proposals
- Counter-proposals

Notification types:

- `barter_proposal`: New exchange proposal received
- `barter_accepted`: Your proposal was accepted
- `barter_rejected`: Your proposal was declined
- `barter_counter`: Counter-proposal received

## Integration Example

Complete flow for adding barter to a listing detail page:

```tsx
"use client";

import { useState } from "react";
import { ExchangeBadge, BarterProposalForm } from "@/components/barter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ListingDetail({ listing }) {
  const [showProposalForm, setShowProposalForm] = useState(false);

  return (
    <div>
      {/* Show badge if listing is open to exchange */}
      {listing.openToExchange && <ExchangeBadge variant="default" />}

      {/* Propose exchange button */}
      <Button onClick={() => setShowProposalForm(true)}>
        Propose Exchange
      </Button>

      {/* Proposal form dialog */}
      <Dialog open={showProposalForm} onOpenChange={setShowProposalForm}>
        <DialogContent>
          <BarterProposalForm
            targetListingId={listing.id}
            targetListingTitle={listing.title}
            targetListingPrice={listing.price}
            onSuccess={() => setShowProposalForm(false)}
            onCancel={() => setShowProposalForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## Testing

Key scenarios to test:

1. Creating a proposal with valid listings
2. Preventing self-exchange
3. Value difference calculation accuracy
4. Cash adjustment impact on final balance
5. Proposal acceptance creating transaction
6. Counter-proposal workflow
7. Real-time message delivery
8. Proposal expiration after 7 days
9. Notification delivery
10. RLS policies for data access

## Accessibility

All components follow WCAG 2.1 AA standards:

- Proper form labels and error messages
- Keyboard navigation support
- Screen reader announcements
- Color contrast compliance
- Focus management in dialogs

## Performance Considerations

- Lazy load proposal forms in dialogs
- Paginate proposal lists
- Use Supabase Realtime for efficient message updates
- Cache user listings for proposal form
- Optimize value calculations client-side
