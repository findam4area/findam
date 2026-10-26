# Error Handling System

This directory contains the error handling infrastructure for the FindAm application.

## Overview

The error handling system provides:

1. **Custom Error Classes** - Typed error classes for different error scenarios
2. **Error Tracking** - Centralized error tracking with optional Sentry integration
3. **Error Boundaries** - React error boundaries for graceful error handling
4. **Toast Notifications** - User-friendly error messages via toast notifications
5. **API Error Handling** - Consistent error responses from API routes

## Custom Error Classes

### Available Error Classes

```typescript
import {
  APIError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  PaymentError,
  NetworkError,
  DatabaseError,
  FileUploadError,
} from "@/lib/errors";

// Usage examples
throw new AuthenticationError("Invalid credentials");
throw new NotFoundError("User");
throw new ValidationError("Invalid input", { email: ["Invalid email format"] });
throw new RateLimitError();
```

### Creating Custom Errors

All custom errors extend `AppError`:

```typescript
export class CustomError extends AppError {
  constructor(message: string) {
    super(message, 400); // message, statusCode
  }
}
```

## Error Tracking

### Initialization

Error tracking is automatically initialized in the root layout. It supports:

- Console logging (development)
- Sentry integration (optional, production)

### Manual Error Tracking

```typescript
import { trackError, trackMessage, addBreadcrumb } from "@/lib/errors";

// Track an error
try {
  // ... code
} catch (error) {
  trackError(error as Error, {
    tags: { feature: "listings" },
    extra: { listingId: "123" },
  });
}

// Track a message
trackMessage("User completed onboarding", "info");

// Add breadcrumb for debugging
addBreadcrumb({
  message: "User clicked submit button",
  category: "user-action",
  data: { formId: "listing-form" },
});
```

### User Context

User context is automatically set when users log in:

```typescript
import { setErrorTrackingUser } from "@/lib/errors";

// Set user (done automatically in ErrorTrackerInit)
setErrorTrackingUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// Clear user on logout
setErrorTrackingUser(null);
```

## Error Handling Utilities

### Client-Side Error Handling

```typescript
import { handleError, handleSuccess, handleAsyncOperation } from "@/lib/errors";

// Simple error handling with toast
try {
  await someOperation();
  handleSuccess("Operation completed successfully");
} catch (error) {
  handleError(error);
}

// Async operation with loading state
const result = await handleAsyncOperation(
  async () => {
    return await createListing(data);
  },
  {
    loadingMessage: "Creating listing...",
    successMessage: "Listing created successfully!",
    errorMessage: "Failed to create listing",
    onSuccess: (listing) => {
      router.push(`/listing/${listing.id}`);
    },
  },
);
```

### API Error Handling

```typescript
import {
  withErrorHandling,
  successResponse,
  errorResponse,
} from "@/lib/errors/api-error-handler";

// Wrap API route handler
export const POST = withErrorHandling(async (request: Request) => {
  const body = await request.json();

  // Validation
  const validated = schema.parse(body); // Zod errors are automatically handled

  // Business logic
  const result = await createListing(validated);

  return successResponse(result, 201);
});

// Manual error responses
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return successResponse(data);
  } catch (error) {
    return errorResponse("Failed to fetch data", 500);
  }
}
```

## Error Boundaries

### Component-Level Error Boundaries

```typescript
import { ErrorBoundary, ComponentErrorFallback } from '@/components/error';

function MyComponent() {
  return (
    <ErrorBoundary
      fallback={ComponentErrorFallback}
      onError={(error, errorInfo) => {
        // Custom error handling
        console.log('Component error:', error);
      }}
    >
      <ChildComponent />
    </ErrorBoundary>
  );
}
```

### Page-Level Error Boundaries

Next.js automatically uses `error.tsx` files for route-level error boundaries:

```typescript
// app/some-route/error.tsx
'use client';

import { PageErrorFallback } from '@/components/error';

export default function Error({ error, reset }) {
  return <PageErrorFallback error={error} resetError={reset} />;
}
```

## Toast Notifications

Toast notifications are automatically shown for errors:

```typescript
import {
  handleSuccess,
  handleError,
  handleWarning,
  handleInfo,
} from "@/lib/errors";

// Success toast
handleSuccess("Listing created!", "Your listing is now live");

// Error toast
handleError(error);

// Warning toast
handleWarning("Storage almost full", "You have 2 listings remaining");

// Info toast
handleInfo("New feature available", "Check out our new messaging system");
```

## Best Practices

1. **Always use custom error classes** instead of generic `Error`
2. **Track errors** for debugging and monitoring
3. **Provide user-friendly messages** in error handlers
4. **Use error boundaries** to prevent entire app crashes
5. **Add breadcrumbs** for complex user flows
6. **Test error scenarios** in development

## Integration with Sentry (Optional)

To integrate with Sentry:

1. Install Sentry SDK:

   ```bash
   npm install @sentry/nextjs
   ```

2. Initialize Sentry in your app:

   ```typescript
   // app/layout.tsx or instrumentation.ts
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

3. The error tracking system will automatically use Sentry if available

## Error Response Format

API errors follow this format:

```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "errors": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

## Testing Error Handling

```typescript
// Test error boundaries
it('should render error fallback on error', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});

// Test error handling
it('should handle API errors', async () => {
  const error = new APIError('Failed to fetch', 500);
  handleError(error);

  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch'));
});
```
