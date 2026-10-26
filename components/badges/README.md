# Badge Components

UI components for displaying verification and premium status badges on business profiles.

## Components

### VerifiedBadge

Displays a verification badge on business profiles with a tooltip explaining the verification criteria.

**Requirements:** 14.6, 14.7  
**Tasks:** 22.1

#### Props

```typescript
interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}
```

#### Features

- Checkmark icon with distinctive blue color
- Tooltip on hover explaining verification process
- Three size variants (small, medium, large)
- Optional text label display
- Fully accessible with ARIA labels

#### Usage

```tsx
import { VerifiedBadge } from "@/components/badges";

// Icon only
<VerifiedBadge />

// With label
<VerifiedBadge showLabel />

// Custom size
<VerifiedBadge size="lg" showLabel />
```

---

### PremiumBadge

Displays premium tier badges with tier-specific styling for basic, pro, and enterprise tiers.

**Requirements:** 15.2  
**Tasks:** 22.2

#### Props

```typescript
interface PremiumBadgeProps {
  tier: "basic" | "pro" | "enterprise";
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}
```

#### Features

- Different visual styles for each tier:
  - **Basic**: Gray gradient with Star icon
  - **Pro**: Blue gradient with Zap icon
  - **Enterprise**: Purple-pink-orange gradient with Crown icon
- Three size variants
- Optional text label display
- Hover effects with scale and shadow
- Fully accessible

#### Usage

```tsx
import { PremiumBadge } from "@/components/badges";

// Basic tier
<PremiumBadge tier="basic" />

// Pro tier with label
<PremiumBadge tier="pro" showLabel />

// Enterprise tier, large size
<PremiumBadge tier="enterprise" size="lg" showLabel />
```

## Styling

Both components use Tailwind CSS for styling and follow the project's design system. They are responsive and work well on all screen sizes.

## Accessibility

- Proper ARIA labels for screen readers
- Keyboard navigation support through tooltip component
- Color contrast meets WCAG AA standards
- Focus indicators for interactive elements
