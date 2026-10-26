# Sentry Setup Guide

This guide explains how to set up Sentry for error tracking and monitoring in the FindAm marketplace.

## Requirements Implemented

- **19.6**: Log errors to error tracking service (Sentry) with context
- **33.4**: Integrate Sentry for error tracking and performance monitoring
- **33.6**: Log all errors with context (user ID, session, stack trace)
- **33.8**: Set up alerts for critical errors and performance degradation

## Prerequisites

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for your Next.js application
3. Get your DSN (Data Source Name) from the project settings

## Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your_organization_slug
SENTRY_PROJECT=your_project_slug
```

### Getting Your Credentials

1. **DSN**: Found in Settings → Projects → [Your Project] → Client Keys (DSN)
2. **Auth Token**: Settings → Account → API → Auth Tokens → Create New Token
   - Scopes needed: `project:read`, `project:write`, `project:releases`
3. **Organization Slug**: Found in your Sentry URL: `https://sentry.io/organizations/[org-slug]/`
4. **Project Slug**: Found in Settings → Projects → [Your Project] → General Settings

## Features

### 1. Error Tracking with Context

All errors are automatically tracked with rich context:

```typescript
import { trackError } from '@/lib/errors';

try {
  // Your code
} catch (error) {
  trackError(error as Error, {
    user: { id: userId, email: userEmail },
    tags: { feature: 'checkout', action: 'payment' },
    extra: { orderId, amount },
  });
}
```

### 2. Error Severity Levels

Errors are automatically categorized by severity:

- **CRITICAL**: Payment failures, database errors, security breaches
- **HIGH**: Authentication/authorization failures
- **MEDIUM**: General application errors
- **LOW**: Validation errors, not found errors

### 3. Performance Monitoring

Core Web Vitals are automatically tracked:

- **LCP** (Largest Contentful Paint): Target < 2.5s
- **FID** (First Input Delay): Target < 100ms
- **CLS** (Cumulative Layout Shift): Target < 0.1

Alerts are triggered when metrics exceed thresholds.

### 4. Error Filtering

Non-critical errors are automatically filtered:

- Network request failures (expected in offline scenarios)
- Browser extension errors
- Hydration warnings in development
- ResizeObserver errors

### 5. Breadcrumbs

Track user actions leading to errors:

```typescript
import { addBreadcrumb } from '@/lib/errors';

addBreadcrumb({
  message: 'User clicked checkout button',
  category: 'user-action',
  level: 'info',
  data: { cartTotal: 150.00 },
});
```

## Alert Configuration

### In Sentry Dashboard

1. Go to **Alerts** → **Create Alert**
2. Set up alerts for:

#### Critical Error Alert
- **Condition**: Error count > 10 in 5 minutes
- **Filter**: `severity:critical`
- **Action**: Email + Slack notification

#### Performance Degradation Alert
- **Condition**: LCP > 2.5s for 50% of transactions
- **Action**: Email notification

#### High Error Rate Alert
- **Condition**: Error rate > 5% in 10 minutes
- **Action**: Email + PagerDuty

### Webhook Integration (Optional)

For custom alerting (e.g., Slack, Discord):

```typescript
// In sentry-config.ts
export function sendCriticalErrorWebhook(error: Error) {
  fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Critical Error: ${error.message}`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'Error', value: error.message, short: false },
          { title: 'Stack', value: error.stack?.slice(0, 500), short: false },
        ],
      }],
    }),
  });
}
```

## Testing

### Test Error Tracking

```typescript
// In your browser console or test file
if (typeof window !== 'undefined' && window.__ERROR_TRACKER__) {
  window.__ERROR_TRACKER__.captureException(
    new Error('Test error from console'),
    { tags: { test: 'true' } }
  );
}
```

### Test Performance Monitoring

Performance metrics are automatically collected. Check Sentry's Performance tab after:
1. Loading the homepage
2. Navigating between pages
3. Performing user interactions

## Monitoring Dashboard

Access your Sentry dashboard to view:

1. **Issues**: All tracked errors with frequency and impact
2. **Performance**: Transaction traces and Core Web Vitals
3. **Releases**: Error rates per deployment
4. **Alerts**: Active alerts and notification history

## Best Practices

### 1. User Privacy

Sensitive data is automatically masked:
- All text in session replays
- All media in session replays
- User emails (only IDs are tracked)

### 2. Error Context

Always provide context when tracking errors:

```typescript
trackError(error, {
  tags: {
    feature: 'listings',
    action: 'create',
  },
  extra: {
    listingId,
    userId,
    timestamp: new Date().toISOString(),
  },
});
```

### 3. Breadcrumbs

Add breadcrumbs for important user actions:

```typescript
addBreadcrumb({
  message: 'User submitted listing form',
  category: 'form',
  data: { title, price, category },
});
```

### 4. Release Tracking

Tag errors with release versions in `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  nextConfig,
  {
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  }
);
```

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is correct in `.env.local`
2. Verify `NEXT_PUBLIC_SENTRY_DSN` starts with `NEXT_PUBLIC_`
3. Check browser console for Sentry initialization errors
4. Ensure error is not filtered by `beforeSend` in `sentry.client.config.ts`

### Performance Data Missing

1. Verify `tracesSampleRate` is > 0 in `sentry.client.config.ts`
2. Check browser supports Performance API
3. Ensure sufficient traffic (sample rate may filter events)

### Alerts Not Triggering

1. Verify alert rules in Sentry dashboard
2. Check notification settings (email, Slack, etc.)
3. Ensure error severity matches alert filters
4. Verify webhook URLs are correct

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Alert Configuration](https://docs.sentry.io/product/alerts/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## Support

For issues with Sentry integration:
1. Check Sentry's [status page](https://status.sentry.io/)
2. Review [Sentry documentation](https://docs.sentry.io/)
3. Contact Sentry support through their dashboard
