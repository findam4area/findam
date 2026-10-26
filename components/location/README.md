# Location Components

This directory contains reusable location-related UI components for the FindAm platform.

## Components

### StateSelector

A dropdown component for selecting Nigerian states.

**Props:**

- `value?: string` - Currently selected state
- `onValueChange: (value: string) => void` - Callback when state changes
- `label?: string` - Label text (default: "State")
- `placeholder?: string` - Placeholder text (default: "Select a state")
- `required?: boolean` - Whether the field is required (default: false)
- `error?: string` - Error message to display
- `disabled?: boolean` - Whether the selector is disabled (default: false)
- `className?: string` - Additional CSS classes

**Example:**

```tsx
<StateSelector
  value={selectedState}
  onValueChange={setSelectedState}
  label="State"
  required
  error={errors.state?.message}
/>
```

### AreaSelector

A dropdown component for selecting areas within a Nigerian state. The component is automatically disabled until a state is selected.

**Props:**

- `state?: string` - The selected state (required to enable the selector)
- `value?: string` - Currently selected area
- `onValueChange: (value: string) => void` - Callback when area changes
- `label?: string` - Label text (default: "Area")
- `placeholder?: string` - Placeholder text (default: "Select an area")
- `required?: boolean` - Whether the field is required (default: false)
- `error?: string` - Error message to display
- `disabled?: boolean` - Whether the selector is disabled (default: false)
- `className?: string` - Additional CSS classes

**Example:**

```tsx
<AreaSelector
  state={selectedState}
  value={selectedArea}
  onValueChange={setSelectedArea}
  label="Area"
  error={errors.area?.message}
/>
```

### LocationDisplay

A component for displaying location information (state and optional area) with an icon.

**Props:**

- `state: string` - The state to display (required)
- `area?: string` - The area to display (optional)
- `className?: string` - Additional CSS classes for the container
- `showIcon?: boolean` - Whether to show the map pin icon (default: true)
- `iconClassName?: string` - CSS classes for the icon (default: "h-4 w-4")
- `textClassName?: string` - CSS classes for the text (default: "text-sm text-gray-400")

**Example:**

```tsx
<LocationDisplay
  state="Lagos"
  area="Ikeja"
  showIcon={true}
  iconClassName="w-4 h-4 text-gray-500"
  textClassName="text-sm text-gray-400"
/>
```

## Location Data

The components use the `NIGERIAN_STATES` constant from `lib/constants/index.ts`, which contains:

- 7 major Nigerian states (including FCT)
- Areas for each state

## Validation

Location validation is handled by:

- `lib/validations/listing.ts` - Zod schemas for listing and filter validation
- `lib/utils/location-helpers.ts` - Helper functions for location validation and formatting

## Usage in Forms

When using these components in forms with React Hook Form:

```tsx
import { StateSelector, AreaSelector } from "@/components/location";

// In your form component
<StateSelector
  value={watch("state")}
  onValueChange={(value) => {
    setValue("state", value);
    setValue("area", undefined); // Reset area when state changes
  }}
  required
  error={errors.state?.message}
/>

<AreaSelector
  state={watch("state")}
  value={watch("area")}
  onValueChange={(value) => setValue("area", value)}
  error={errors.area?.message}
/>
```

## Styling

All components use Tailwind CSS classes and follow the FindAm design system:

- Dark mode by default
- Neon accent colors
- Glassmorphism effects
- Consistent spacing and typography
