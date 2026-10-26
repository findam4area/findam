/**
 * Sentry Client-Side Configuration
 * 
 * Requirements Coverage:
 * - 5.1: Capture client-side JavaScript errors
 * - 5.2: Capture unhandled promise rejections
 * - 5.3: Include stack trace information
 * - 5.4: Capture browser context (user agent, viewport)
 * - 5.5: Session replay sampling (10% normal, 100% error sessions)
 * - 9.3: Environment-aware configuration
 * - 9.4: Debug mode in development only
 * 
 * This configuration handles client-side error tracking with:
 * - Session replay for debugging with privacy settings
 * - Performance monitoring and browser tracing
 * - User context tracking with PII scrubbing
 * - Non-critical error filtering
 * - Critical error alerting
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Requirement 9.1: Environment-specific DSN from environment variables
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Requirement 9.3, 9.4: Environment-aware configuration
  environment: process.env.NODE_ENV || "development",
  
  // Requirement 9.4: Debug mode only in development
  debug: process.env.NODE_ENV === "development",

  // Requirement 7.3, 7.5: Release tagging with git commit SHA for source map association
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,

  // Requirement 8.7: Transaction sample rate - 10% in production to manage quota
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Requirement 5.5: Session replay sampling configuration
  replaysSessionSampleRate: 0.1,  // 10% of normal sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions

  // Performance profiling sample rate
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Integrations for enhanced error tracking and performance monitoring
  integrations: [
    // Requirement 5.5: Session replay with privacy settings
    Sentry.replayIntegration({
      maskAllText: true,        // Privacy: mask all text content
      blockAllMedia: true,      // Privacy: block images and videos
      // Capture network requests for debugging
      networkDetailAllowUrls: [
        window.location.origin,
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      ],
    }),
    // Requirement 5.4: Browser tracing for performance monitoring
    Sentry.browserTracingIntegration({
      enableLongTask: true,  // Track long tasks (>50ms)
    }),
    // Performance profiling for production optimization
    Sentry.browserProfilingIntegration(),
  ],

  // Error filtering and enhancement hook
  // Requirements 5.6, 5.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Requirement 8.1: Filter errors from browser extensions
    if (event.exception?.values) {
      const frames = event.exception.values[0]?.stacktrace?.frames || [];
      const hasBrowserExtensionFrame = frames.some((frame) => {
        const filename = frame.filename || "";
        return (
          filename.includes("chrome-extension://") ||
          filename.includes("moz-extension://") ||
          filename.includes("safari-extension://")
        );
      });
      if (hasBrowserExtensionFrame) {
        return null; // Drop browser extension errors
      }
    }

    // Check for critical errors FIRST before filtering (Requirements 8.4, 8.5, 8.6)
    if (error && typeof error === "object" && "message" in error) {
      const message = String(error.message).toLowerCase();

      // Requirement 8.4, 8.5, 8.6: Check critical error patterns FIRST
      // Critical errors should NEVER be filtered, even if they contain non-critical patterns
      const criticalPatterns = [
        /payment.*fail/i,           // Requirement 8.4: Payment failures
        /auth.*fail/i,              // Requirement 8.5: Authentication failures
        /unauthorized.*access/i,    // Requirement 8.5: Auth failures
        /security.*breach/i,        // Requirement 8.6: Security breaches
        /data.*corrupt/i,
        /injection.*detect/i,       // Requirement 8.6: Security breaches
      ];

      const isCritical = criticalPatterns.some((pattern) => pattern.test(message));

      if (isCritical) {
        // Mark as critical for alert configuration
        event.level = "fatal";
        event.tags = {
          ...event.tags,
          critical: "true",
          alert: "immediate",
        };

        // Log to console for immediate visibility in development
        if (process.env.NODE_ENV === "development") {
          console.error("🚨 CRITICAL CLIENT ERROR:", {
            message: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Only filter non-critical patterns if error is NOT critical
        // Requirement 8.2, 8.3: Filter out non-critical error patterns
        const nonCriticalPatterns = [
          "network request failed",
          "failed to fetch",
          "load failed",
          "cancelled",          // Requirement 8.2: Cancelled requests
          "aborted",
          "aborterror",         // Requirement 8.2: AbortError
          "resizeobserver",     // Requirement 8.3: ResizeObserver loop exceeded
          "chunk load error",   // Common with code splitting
        ];

        if (nonCriticalPatterns.some((pattern) => message.includes(pattern))) {
          return null; // Drop non-critical errors
        }

        // Ignore hydration errors in development
        if (
          process.env.NODE_ENV === "development" &&
          (message.includes("hydration") || message.includes("hydrate"))
        ) {
          return null;
        }
      }
    }

    // Requirement 5.6, 5.7: Scrub PII from user context
    if (event.user) {
      event.user = {
        id: event.user.id, // Keep user ID for tracking
        // Remove email, name, and other PII
      };
    }

    // Requirement 5.4: Capture browser context including user agent and viewport
    event.contexts = {
      ...event.contexts,
      browser: {
        name: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      device: {
        online: navigator.onLine,
        memory: (performance as any).memory?.jsHeapSizeLimit,
      },
    };

    return event;
  },

  // Requirement 8.1, 8.2, 8.3: Ignore specific non-critical error patterns
  ignoreErrors: [
    // Requirement 8.1: Browser extensions
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",
    "safari-extension://",
    // Random plugins/extensions
    "Can't find variable: ZiteReader",
    "jigsaw is not defined",
    "ComboSearch is not defined",
    // Social media errors
    "fb_xd_fragment",
    "fbq is not defined",
    // ISP injected ads
    "bmi_SafeAddOnload",
    "EBCallBackMessageReceived",
    // Requirement 8.2: Cancelled requests and AbortErrors
    "AbortError",
    "The user aborted a request",
    "The operation was aborted",
    "Load failed",
    "Failed to fetch",
    // Requirement 8.3: ResizeObserver loop exceeded
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Common non-issues
    "Non-Error promise rejection captured",
    "Non-Error exception captured",
  ],

  // Requirement 8.1: Denylist for URLs (ignore errors from these sources)
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
    // Third-party scripts
    /google-analytics\.com/i,
    /googletagmanager\.com/i,
    /facebook\.net/i,
    /doubleclick\.net/i,
  ],
});
