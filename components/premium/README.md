# Premium Components

UI components for premium subscription features, upgrades, and analytics.

## Components

### PremiumUpgradeModal

A comprehensive modal for upgrading business profiles to premium status with pricing tiers, duration options, and feature comparison.

**Requirements:** 15.1, 15.3, 15.6  
**Tasks:** 22.3

#### Props

```typescript
interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessProfileId: string;
}
```

#### Features

- **Three Pricing Tiers**:
  - Basic: ₦29.99/month - Essential features
  - Pro: ₦59.99/month - Advanced features (highlighted as most popular)
  - Enterprise: ₦99.99/month - Maximum visibility

- **Duration Options** with discounts:
  - 1 month (0% discount)
  - 3 months (5% discount)
  - 6 months (10% discount)
  - 12 months (15% discount)

- **Feature Comparison Table**: Side-by-side comparison of all tier features
- **Dynamic Pricing**: Automatically calculates total with applied discounts
- **Payment Integration**: Calls POST `/api/business-profiles/[id]/premium` and redirects to payment URL
- **Responsive Design**: Works on mobile, tablet, and desktop

#### Usage

```tsx
import { PremiumUpgradeModal } from "@/components/premium";

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Upgrade to Premium</button>
      <PremiumUpgradeModal
        open={open}
        onOpenChange={setOpen}
        businessProfileId="business-id-here"
      />
    </>
  );
}
```

#### API Integration

The component calls the premium upgrade endpoint:

```typescript
POST /api/business-profiles/:id/premium
{
  tier: "basic" | "pro" | "enterprise",
  duration_months: 1 | 3 | 6 | 12,
  payment_method: "paystack"
}
```

Expected response:
```typescript
{
  payment_url: string;
  subscription_id: string;
}
```

---

### PremiumAnalyticsDashboard

Displays comprehensive analytics for premium business profiles including view counts, engagement metrics, and trending products/services.

**Requirements:** 15.4  
**Tasks:** 22.4

#### Props

```typescript
interface PremiumAnalyticsDashboardProps {
  businessProfileId: string;
  className?: string;
}
```

#### Features

- **Key Metrics Cards**:
  - Total profile views
  - Click-through rate
  - Engagement score
  - Recent activity (last 7 days)

- **Time Range Selection**:
  - Last 7 days
  - Last 30 days
  - Last 90 days

- **Engagement Breakdown**:
  - Product clicks
  - Service clicks
  - Contact clicks
  - Website visits
  - Profile views (7 and 30 days)

- **Trending Items**: Top 5 products and services by views/clicks
- **Visitor Demographics**: Top cities and states
- **Loading States**: Spinner during data fetch
- **Error Handling**: Displays friendly error messages
- **Premium Access Control**: Shows error if user doesn't have premium access

#### Usage

```tsx
import { PremiumAnalyticsDashboard } from "@/components/premium";

function BusinessDashboard({ businessId }) {
  return (
    <PremiumAnalyticsDashboard businessProfileId={businessId} />
  );
}
```

#### API Integration

The component calls the analytics endpoint:

```typescript
GET /api/business-profiles/:id/analytics?timeRange=7d|30d|90d
```

Expected response:
```typescript
{
  view_count: number;
  click_through_rate: number;
  engagement_metrics: {
    profile_views_last_7_days: number;
    profile_views_last_30_days: number;
    product_clicks: number;
    service_clicks: number;
    contact_clicks: number;
    website_clicks: number;
  };
  trending_products?: Array<{
    id: string;
    title: string;
    views: number;
    clicks: number;
  }>;
  trending_services?: Array<{
    id: string;
    title: string;
    views: number;
    clicks: number;
  }>;
  visitor_demographics?: {
    cities: Array<{ name: string; count: number }>;
    states: Array<{ name: string; count: number }>;
  };
}
```

The endpoint should return 403 if the business profile doesn't have an active premium subscription.

## Access Control

**PremiumAnalyticsDashboard** requires an active premium subscription. The component handles:
- 403 Forbidden: Displays "Premium subscription required" message
- Other errors: Displays generic error message
- Loading states: Shows spinner while fetching data

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui components (Card, Dialog, Tabs, Button, Badge)
- Lucide React icons
- Responsive design for all screen sizes

## Accessibility

- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Color contrast meets WCAG AA standards
