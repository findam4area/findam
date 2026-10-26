/**
 * Sentry Server-Side Configuration
 * Implements Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.3, 9.4, 8.7
 * 
 * This configuration handles server-side error tracking with:
 * - Environment-aware configuration (Requirement 9.3, 9.4)
 * - Server-side error capture for RSC, API routes, middleware (Requirement 6.1, 6.2, 6.3)
 * - Stack trace and request context capture (Requirement 6.4, 6.5, 6.6)
 * - Sensitive data scrubbing (Requirement 6.7)
 * - Transaction sampling at 10% for production (Requirement 8.7)
 * - Node.js-specific context capture
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Scrubs sensitive data from request bodies
 * Requirement 6.7: Remove environment variables, secrets, and sensitive fields
 */
function scrubSensitiveData(data: any): any {
  if (!data || typeof data !== "object") return data;

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "api_key",
    "apikey",
    "authorization",
    "cardnumber",
    "cvv",
    "ssn",
    "creditcard",
    "auth_token",
  ];

  const scrubbed = Array.isArray(data) ? [...data] : { ...data };

  for (const key in scrubbed) {
    const lowerKey = key.toLowerCase();
    
    // Check if key matches sensitive patterns
    if (sensitiveKeys.some((pattern) => lowerKey.includes(pattern))) {
      scrubbed[key] = "[REDACTED]";
    } else if (typeof scrubbed[key] === "object" && scrubbed[key] !== null) {
      // Recursively scrub nested objects
      scrubbed[key] = scrubSensitiveData(scrubbed[key]);
    }
  }

  return scrubbed;
}

Sentry.init({
  // Requirement 9.1, 9.5: Environment-specific DSN from environment variables
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Requirement 7.3, 7.5: Release tagging with git commit SHA for source map association
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,

  // Requirement 8.7: Transaction sample rate 10% for production, 100% for development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Requirement 9.3: Debug mode enabled in development, disabled in production
  debug: process.env.NODE_ENV === "development",

  // Requirement 9.2: Tag errors with environment
  environment: process.env.NODE_ENV || "development",

  // Enable profiling for performance insights (10% production, 100% development)
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Requirement 6.7, 8.7: Filter and scrub errors before sending
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Filter based on error level - ignore warnings in production
    if (event.level === "warning" && process.env.NODE_ENV === "production") {
      return null;
    }

    // Filter out expected server errors in development
    if (error && typeof error === "object" && "message" in error) {
      const message = String(error.message).toLowerCase();

      // Non-critical network errors (common in development)
      const nonCriticalPatterns = [
        "econnrefused",
        "enotfound",
        "etimedout",
        "socket hang up",
        "network error",
        "fetch failed",
      ];

      if (
        nonCriticalPatterns.some((pattern) => message.includes(pattern)) &&
        process.env.NODE_ENV !== "production"
      ) {
        console.warn("Filtered non-critical error:", message);
        return null;
      }

      // Flag critical errors for alerting
      const criticalPatterns = [
        /payment.*failed/i,
        /database.*connection/i,
        /authentication.*failed/i,
        /unauthorized.*access/i,
        /data.*corruption/i,
        /security.*breach/i,
      ];

      if (criticalPatterns.some((pattern) => pattern.test(message))) {
        // Mark as critical for alert configuration
        event.level = "fatal";
        event.tags = {
          ...event.tags,
          critical: "true",
          alert: "immediate",
        };

        // Log to console for immediate visibility
        console.error("🚨 CRITICAL SERVER ERROR:", {
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Requirement 6.4, 6.5: Capture Node.js-specific context and request details
    event.contexts = {
      ...event.contexts,
      server: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    // Requirement 6.6, 6.7: Scrub sensitive data from request context
    if (event.request) {
      // Scrub sensitive headers
      if (event.request.headers) {
        const scrubbedHeaders = { ...event.request.headers };
        const sensitiveHeaderKeys = ["authorization", "cookie", "x-api-key"];
        
        for (const key of sensitiveHeaderKeys) {
          if (scrubbedHeaders[key]) {
            scrubbedHeaders[key] = "[REDACTED]";
          }
        }
        
        event.request.headers = scrubbedHeaders;
      }

      // Requirement 6.6, 6.7: Scrub sensitive data from request body
      if (event.request.data) {
        event.request.data = scrubSensitiveData(event.request.data);
      }
    }

    // Requirement 6.7: Scrub environment variables from error context
    if (event.extra) {
      const scrubbedExtra: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(event.extra)) {
        // Check if key looks like an environment variable
        if (key.toUpperCase() === key && key.includes("_")) {
          scrubbedExtra[key] = "[REDACTED]";
        } else if (typeof value === "object" && value !== null) {
          scrubbedExtra[key] = scrubSensitiveData(value);
        } else {
          scrubbedExtra[key] = value;
        }
      }
      
      event.extra = scrubbedExtra;
    }

    return event;
  },

  // Requirement 8.7: Ignore specific non-critical errors
  ignoreErrors: [
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "socket hang up",
    "AbortError",
    "The operation was aborted",
  ],

  // Requirement 8.7: Ignore health check transactions to save quota
  ignoreTransactions: ["/api/health", "/api/ping"],
});
