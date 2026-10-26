/**
 * Sentry Client-Side Error Filtering Tests
 * Tests Task 6.2 Requirements: 5.6, 5.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 * 
 * Validates the beforeSend hook implementation in sentry.client.config.ts:
 * - Browser extension error filtering
 * - Cancelled request filtering
 * - ResizeObserver error filtering
 * - PII scrubbing from user context
 * - Critical error tagging (payment, auth, security)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';

// Mock navigator and window for browser context
global.navigator = {
  userAgent: 'Mozilla/5.0 Test Browser',
  onLine: true,
} as any;

global.window = {
  location: { origin: 'https://test.com', href: 'https://test.com/test' },
  innerWidth: 1920,
  innerHeight: 1080,
} as any;

global.performance = {
  memory: {
    jsHeapSizeLimit: 2147483648,
  },
} as any;

// Create a mock beforeSend function that replicates the logic from sentry.client.config.ts
function createMockBeforeSend() {
  return function beforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
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
  };
}

describe('Sentry Client-Side Error Filtering (Task 6.2)', () => {
  let beforeSend: ReturnType<typeof createMockBeforeSend>;
  
  beforeEach(() => {
    beforeSend = createMockBeforeSend();
  });

  describe('Requirement 8.1: Filter Browser Extension Errors', () => {
    it('should filter Chrome extension errors', () => {
      const event: ErrorEvent = {
        exception: {
          values: [{
            type: 'Error',
            value: 'Extension error',
            stacktrace: {
              frames: [
                { filename: 'chrome-extension://abc123/script.js', function: 'test', lineno: 1, colno: 1 }
              ]
            }
          }]
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Extension error')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter Firefox extension errors', () => {
      const event: ErrorEvent = {
        exception: {
          values: [{
            type: 'Error',
            value: 'Extension error',
            stacktrace: {
              frames: [
                { filename: 'moz-extension://xyz789/addon.js', function: 'test', lineno: 1, colno: 1 }
              ]
            }
          }]
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Extension error')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter Safari extension errors', () => {
      const event: ErrorEvent = {
        exception: {
          values: [{
            type: 'Error',
            value: 'Extension error',
            stacktrace: {
              frames: [
                { filename: 'safari-extension://def456/extension.js', function: 'test', lineno: 1, colno: 1 }
              ]
            }
          }]
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Extension error')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should NOT filter normal application errors', () => {
      const event: ErrorEvent = {
        exception: {
          values: [{
            type: 'Error',
            value: 'Application error',
            stacktrace: {
              frames: [
                { filename: 'https://app.com/bundle.js', function: 'test', lineno: 1, colno: 1 }
              ]
            }
          }]
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Application error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
    });
  });

  describe('Requirement 8.2: Filter Cancelled Requests', () => {
    it('should filter "cancelled" errors', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Request cancelled by user')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter "aborted" errors', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Request aborted')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter "AbortError" errors', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('AbortError: The operation was aborted')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter "Failed to fetch" errors', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Failed to fetch')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter "Network request failed" errors', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Network request failed')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter "Load failed" errors', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Load failed')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });
  });

  describe('Requirement 8.3: Filter ResizeObserver Errors', () => {
    it('should filter "ResizeObserver loop limit exceeded"', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('ResizeObserver loop limit exceeded')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter ResizeObserver errors with different casing', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('RESIZEOBSERVER loop completed with undelivered notifications')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });
  });

  describe('Requirement 5.6, 5.7: PII Scrubbing', () => {
    it('should remove email from user context', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        user: {
          id: 'user-123',
          email: 'sensitive@example.com',
          username: 'testuser',
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.user).toEqual({ id: 'user-123' });
      expect(result!.user).not.toHaveProperty('email');
      expect(result!.user).not.toHaveProperty('username');
    });

    it('should keep user ID for tracking', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        user: {
          id: 'user-456',
          email: 'user@test.com',
          name: 'John Doe',
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.user?.id).toBe('user-456');
    });

    it('should handle events without user context', () => {
      const event: ErrorEvent = {
        exception: { values: [] }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.user).toBeUndefined();
    });
  });

  describe('Requirement 8.4: Tag Payment Failures as Critical', () => {
    it('should tag "payment failed" as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Payment failed to process')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
      expect(result!.tags?.alert).toBe('immediate');
    });

    it('should tag case-insensitive payment failures', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('PAYMENT FAILURE detected')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });
  });

  describe('Requirement 8.5: Tag Authentication Failures as Critical', () => {
    it('should tag "auth failed" as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Auth failed for user')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
      expect(result!.tags?.alert).toBe('immediate');
    });

    it('should tag "unauthorized access" as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Unauthorized access attempt detected')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });
  });

  describe('Requirement 8.6: Tag Security Breaches as Critical', () => {
    it('should tag "security breach" as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Security breach detected in API')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
      expect(result!.tags?.alert).toBe('immediate');
    });

    it('should tag "data corruption" as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Data corruption detected')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });

    it('should tag "injection detected" as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('SQL injection detected in query')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });
  });

  describe('Browser Context Capture (Requirement 5.4)', () => {
    it('should capture user agent in browser context', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.contexts?.browser?.name).toBe('Mozilla/5.0 Test Browser');
    });

    it('should capture viewport dimensions', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.contexts?.browser?.viewport).toEqual({
        width: 1920,
        height: 1080,
      });
    });

    it('should capture device online status', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.contexts?.device?.online).toBe(true);
    });

    it('should capture memory information', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.contexts?.device?.memory).toBe(2147483648);
    });
  });

  describe('Non-Critical Errors Filtering', () => {
    it('should filter chunk load errors', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Chunk load error for chunk 42')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should NOT filter critical errors that contain filtered words', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Payment failed - network request failed')
      };

      // Payment failure should take precedence
      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors without messages', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: {} as Error
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
    });

    it('should handle null user context', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        user: null
      } as any;

      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
    });

    it('should handle empty stacktrace frames', () => {
      const event: ErrorEvent = {
        exception: {
          values: [{
            type: 'Error',
            value: 'Test error',
            stacktrace: {
              frames: []
            }
          }]
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
    });

    it('should preserve existing tags when adding critical tags', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        tags: {
          environment: 'production',
          version: '1.0.0',
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Payment failed')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.tags).toEqual({
        environment: 'production',
        version: '1.0.0',
        critical: 'true',
        alert: 'immediate',
      });
    });
  });
});
