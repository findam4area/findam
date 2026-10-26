/**
 * Error Tracking Service
 * 
 * Provides centralized error tracking and monitoring.
 * Requirements: 15.7 (Error Tracking and Monitoring)
 */

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  contexts?: Record<string, any>;
}

export interface ErrorTracker {
  captureException: (error: Error | any, context?: ErrorContext) => void;
  captureMessage: (
    message: string,
    level?: "info" | "warning" | "error",
    context?: ErrorContext,
  ) => void;
  setUser: (user: { id: string; email?: string; username?: string } | null) => void;
  addBreadcrumb: (breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: any;
  }) => void;
}

class ConsoleErrorTracker implements ErrorTracker {
  private user: { id: string; email?: string; username?: string } | null = null;
  private breadcrumbs: any[] = [];

  captureException(error: Error | any, context?: ErrorContext): void {
    // Safely serialize the error - handle both Error objects and plain objects
    let errorInfo;
    
    if (error instanceof Error) {
      errorInfo = {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: error.stack || 'No stack trace available',
      };
    } else if (error && typeof error === 'object') {
      // Handle plain objects (like Supabase PostgrestError)
      errorInfo = {
        name: error.name || error.code || 'Error',
        message: error.message || error.error_description || JSON.stringify(error),
        details: error.details || undefined,
        hint: error.hint || undefined,
        code: error.code || undefined,
        stack: error.stack || 'No stack trace available',
      };
    } else if (typeof error === 'string') {
      errorInfo = {
        name: 'StringError',
        message: error,
        stack: 'No stack trace available',
      };
    } else {
      errorInfo = {
        name: 'UnknownError',
        message: 'An error occurred but no valid error information was provided',
        stack: 'No stack trace available',
      };
    }

    console.error("[Error Tracker] Exception:", {
      error: errorInfo,
      user: context?.user || this.user,
      tags: context?.tags,
      extra: context?.extra,
      contexts: context?.contexts,
      breadcrumbs: this.breadcrumbs.slice(-10), // Last 10 breadcrumbs
      timestamp: new Date().toISOString(),
    });
  }

  captureMessage(
    message: string,
    level: "info" | "warning" | "error" = "info",
    context?: ErrorContext,
  ): void {
    const levelUpper = level.toUpperCase();
    console.log("[Error Tracker] " + levelUpper + ":", {
      message,
      level,
      user: context?.user || this.user,
      tags: context?.tags,
      extra: context?.extra,
      timestamp: new Date().toISOString(),
    });
  }

  setUser(
    user: { id: string; email?: string; username?: string } | null,
  ): void {
    this.user = user;
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: any;
  }): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }
  }
}

// Initialize error tracker
let errorTracker: ErrorTracker;

if (typeof window !== "undefined") {
  errorTracker = new ConsoleErrorTracker();
  (window as any).__ERROR_TRACKER__ = errorTracker;
} else {
  // Server-side fallback
  errorTracker = {
    captureException: (error: Error | any, context?: ErrorContext) => {
      console.error("Server Error:", error, context);
    },
    captureMessage: (
      message: string,
      level: "info" | "warning" | "error" = "info",
      context?: ErrorContext,
    ) => {
      const levelUpper = level.toUpperCase();
      console.log("[Server] " + levelUpper + ":", message, context);
    },
    setUser: () => {},
    addBreadcrumb: () => {},
  };
}

export default errorTracker;

// Helper functions for convenience
export function initErrorTracker(): void {
  if (typeof window !== "undefined" && !(window as any).__ERROR_TRACKER__) {
    (window as any).__ERROR_TRACKER__ = new ConsoleErrorTracker();
  }
}

export function getErrorTracker(): ErrorTracker {
  return errorTracker;
}

export function trackError(error: Error | any, context?: ErrorContext): void {
  errorTracker.captureException(error, context);
}

export function trackMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: ErrorContext,
): void {
  errorTracker.captureMessage(message, level, context);
}

export function setErrorTrackingUser(
  user: { id: string; email?: string; username?: string } | null,
): void {
  errorTracker.setUser(user);
}

export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: string;
  data?: any;
}): void {
  errorTracker.addBreadcrumb(breadcrumb);
}
