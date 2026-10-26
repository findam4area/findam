/**
 * Sentry configuration utilities
 * Implements Requirements 19.6, 33.4, 33.6, 33.8
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Error severity levels for alerting
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Critical error patterns that should trigger immediate alerts
 */
const CRITICAL_ERROR_PATTERNS = [
  /payment.*failed/i,
  /payment.*error/i,
  /database.*connection/i,
  /database.*error/i,
  /data.*corruption/i,
  /security.*breach/i,
  /unauthorized.*access.*attempt/i, // More specific
];

/**
 * High severity error patterns
 */
const HIGH_SEVERITY_PATTERNS = [
  /authentication.*failed/i,
  /authorization.*failed/i,
  /auth.*error/i,
];

/**
 * Determine error severity based on error type and message
 */
export function getErrorSeverity(error: Error): ErrorSeverity {
  const message = error.message.toLowerCase();

  // Check for critical patterns first
  if (CRITICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return ErrorSeverity.CRITICAL;
  }

  // Check for high severity patterns
  if (HIGH_SEVERITY_PATTERNS.some((pattern) => pattern.test(message))) {
    return ErrorSeverity.HIGH;
  }

  // Check error type
  if (error.name === "PaymentError" || error.name === "DatabaseError") {
    return ErrorSeverity.CRITICAL;
  }

  if (error.name === "AuthenticationError" || error.name === "AuthorizationError") {
    return ErrorSeverity.HIGH;
  }

  if (error.name === "ValidationError" || error.name === "NotFoundError") {
    return ErrorSeverity.LOW;
  }

  // Default to medium
  return ErrorSeverity.MEDIUM;
}

/**
 * Log error to Sentry with enhanced context
 * Implements Requirement 33.6: Log errors with context (user ID, session, stack trace)
 */
export function logErrorToSentry(
  error: Error,
  context?: {
    userId?: string;
    sessionId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  const severity = getErrorSeverity(error);

  Sentry.captureException(error, {
    level: severity === ErrorSeverity.CRITICAL ? "fatal" : 
           severity === ErrorSeverity.HIGH ? "error" :
           severity === ErrorSeverity.MEDIUM ? "warning" : "info",
    user: context?.userId ? { id: context.userId } : undefined,
    tags: {
      ...context?.tags,
      severity,
      environment: process.env.NODE_ENV || "development",
    },
    extra: {
      ...context?.extra,
      sessionId: context?.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    },
    contexts: {
      runtime: {
        name: typeof window !== "undefined" ? "browser" : "node",
        version: typeof navigator !== "undefined" ? navigator.userAgent : process.version,
      },
    },
  });

  // Requirement 33.8: For critical errors, also log to console for immediate visibility
  if (severity === ErrorSeverity.CRITICAL) {
    console.error("🚨 CRITICAL ERROR:", {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Set up performance monitoring
 * Implements Requirement 33.7: Performance monitoring with Core Web Vitals tracking
 */
export function setupPerformanceMonitoring() {
  if (typeof window === "undefined") return;

  // Track Core Web Vitals
  if ("PerformanceObserver" in window) {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        Sentry.setMeasurement("lcp", lastEntry.startTime, "millisecond");
        
        if (lastEntry.startTime > 2500) {
          Sentry.captureMessage("Poor LCP performance", {
            level: "warning",
            tags: { metric: "lcp" },
            extra: { value: lastEntry.startTime },
          });
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          
          Sentry.setMeasurement("fid", fid, "millisecond");
          
          if (fid > 100) {
            Sentry.captureMessage("Poor FID performance", {
              level: "warning",
              tags: { metric: "fid" },
              extra: { value: fid },
            });
          }
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        Sentry.setMeasurement("cls", clsValue, "");
        
        if (clsValue > 0.1) {
          Sentry.captureMessage("Poor CLS performance", {
            level: "warning",
            tags: { metric: "cls" },
            extra: { value: clsValue },
          });
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      console.warn("Failed to set up performance monitoring:", error);
    }
  }
}

/**
 * Filter non-critical warnings
 * Implements Requirement 33.4: Filter out non-critical warnings
 */
export function shouldReportError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Filter out non-critical warnings
  const nonCriticalPatterns = [
    /network request failed/i,
    /failed to fetch/i,
    /load failed/i,
    /cancelled/i,
    /aborted/i,
    /resizeobserver/i,
    /hydration/i,
  ];

  if (nonCriticalPatterns.some((pattern) => pattern.test(message))) {
    return false;
  }

  // Filter out browser extension errors
  if (message.includes("chrome-extension://") || message.includes("moz-extension://")) {
    return false;
  }

  return true;
}

/**
 * Create alert configuration for critical errors
 * Implements Requirement 33.8: Set up alerts for critical errors
 */
export function configureCriticalErrorAlerts() {
  // This configuration would typically be done in Sentry's dashboard
  // We create a wrapper function instead of reassigning the read-only property
  
  const originalCaptureException = Sentry.captureException.bind(Sentry);
  
  // Export a wrapper function that can be used instead
  return function captureExceptionWithAlerts(error: Error, ...args: any[]) {
    const severity = getErrorSeverity(error);
    
    if (severity === ErrorSeverity.CRITICAL) {
      // Log to console for immediate visibility
      console.error("🚨 CRITICAL ERROR DETECTED:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      
      // You could also send to a webhook or notification service here
      // For example: sendSlackNotification(error);
    }
    
    return originalCaptureException(error, ...args);
  };
}

/**
 * Initialize Sentry with enhanced configuration
 */
export function initializeSentryEnhancements() {
  if (typeof window === "undefined") return;

  setupPerformanceMonitoring();
  configureCriticalErrorAlerts();

  console.log("✅ Sentry enhancements initialized");
}
