/**
 * Sentry Edge Runtime Configuration
 * 
 * Requirements Coverage:
 * - 6.3: Capture errors in Next.js middleware
 * - 9.1: Environment-specific DSN from environment variables
 * - 9.2: Tag errors with environment (development, staging, production)
 * - 8.7: Transaction sampling at 10% for production
 * 
 * This configuration handles Edge runtime error tracking with:
 * - Minimal configuration optimized for Edge runtime constraints
 * - Environment-aware transaction sampling (100% dev, 10% production)
 * - Middleware error capture
 * - No heavy integrations (Edge runtime has limitations)
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Requirement 9.1: Environment-specific DSN from environment variables
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Requirement 7.3, 7.5: Release tagging with git commit SHA for source map association
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,

  // Requirement 8.7: Transaction sample rate - 10% in production, 100% in development
  // Edge runtime has limited CPU time, so keep sampling low in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Requirement 9.2: Tag errors with current environment
  environment: process.env.NODE_ENV || "development",

  // Requirement 9.3, 9.4: Debug mode only in development
  // Keep debug off in production to minimize edge runtime overhead
  debug: process.env.NODE_ENV === "development",

  // Edge runtime has size and execution time constraints
  // Keep integrations minimal - no replay, profiling, or heavy features
  integrations: [],

  // Requirement 6.3: Basic error filtering for middleware
  beforeSend(event) {
    // Filter health check errors in edge middleware
    if (event.request?.url) {
      const url = event.request.url;
      if (url.includes('/api/health') || url.includes('/api/ping')) {
        return null; // Don't report health check errors
      }
    }

    return event;
  },

  // Ignore health check transactions to save quota
  ignoreTransactions: ['/api/health', '/api/ping'],
});
