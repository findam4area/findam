# Deals Components

This directory contains components for displaying time-limited deals and promotions.

## Components

### DealsSection

Main component that displays "Deals of the Day" with countdown timers and automatic expiration handling.

**Requirements Implemented:**
- 13.1: Display "Deals of the Day" section with 4-8 discounted listings
- 13.2: Fetch deals where discount_percentage > 0
- 13.3: Display original price, discounted price, and discount percentage
- 13.4: Display countdown timers for time-limited deals
- 13.5: Auto-remove expired deals
- 13.6: Display deal badges with prominent styling
- 13.7: Sort deals by discount percentage or expiration time
- 13.9: Update timers every second

**Usage:**

```tsx
import { DealsSection } from "@/components/deals";

// With initial data (SSR)
<DealsSection initialDeals={deals} />

// Without initial data (client-side fetch)
<DealsSection />
```

**Props:**

```typescript
interface DealsSectionProps {
  initialDeals?: Deal[];
  className?: string;
}

interface Deal {
  id: string;
  listing: {
    id: string;
    title: string;
    thumbnail: string;
    location: string;
    views: number;
    likes: number;
    vendor: {
      id: string;
      name: string;
      avatar: string;
      isVerified: boolean;
    };
  };
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  expiresAt: string; // ISO 8601 timestamp
}
```

### useCountdown Hook

Custom hook for countdown timers with 1-second updates.

**Usage:**

```tsx
import { useCountdown } from "@/components/deals";

function MyComponent() {
  const timeLeft = useCountdown("2024-12-31T23:59:59Z");
  
  return (
    <div>
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </div>
  );
}
```

**Returns:**

```typescript
interface TimeLeft {
  total: number; // Total milliseconds remaining
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
```

## API Integration

The DealsSection component expects an API endpoint at `/api/deals` that returns:

```json
{
  "deals": [
    {
      "id": "deal-1",
      "listing": {
        "id": "listing-1",
        "title": "Product Name",
        "thumbnail": "/images/product.jpg",
        "location": "Lagos, Nigeria",
        "views": 1234,
        "likes": 56,
        "vendor": {
          "id": "vendor-1",
          "name": "Vendor Name",
          "avatar": "/avatars/vendor.jpg",
          "isVerified": true
        }
      },
      "originalPrice": 50000,
      "discountedPrice": 35000,
      "discountPercentage": 30,
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  ]
}
```

## Features

- **Automatic Expiration**: Deals are automatically removed when their countdown reaches zero
- **Real-time Updates**: Countdown timers update every second
- **Responsive Design**: Grid layout adapts from 1 column (mobile) to 4 columns (desktop)
- **Loading States**: Skeleton loaders while fetching data
- **Empty States**: Friendly message when no deals are available
- **Animations**: Smooth transitions using Framer Motion
- **Accessibility**: Keyboard navigation and ARIA labels

## Styling

The components use Tailwind CSS with the project's design system. Key classes:

- `bg-card`: Card background color
- `border-primary`: Primary border color
- `text-primary`: Primary text color
- `text-muted-foreground`: Muted text color

## Performance

- Images use Next.js Image component with lazy loading
- Blur-up placeholders for smooth loading experience
- Efficient countdown timer with automatic cleanup
- Minimal re-renders using React best practices
