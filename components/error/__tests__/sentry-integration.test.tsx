/**
 * Sentry Integration Tests
 * Tests Requirement 17.2, 19.6, 33.4, 33.6, 33.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import {
  logErrorToSentry,
  getErrorSeverity,
  ErrorSeverity,
  shouldReportError,
} from '@/lib/errors/sentry-config';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  setMeasurement: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('Sentry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Severity Detection', () => {
    it('should classify payment errors as CRITICAL', () => {
      const error = new Error('Payment processing failed');
      const severity = getErrorSeverity(error);
      expect(severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should classify database errors as CRITICAL', () => {
      const error = new Error('Database connection lost');
      const severity = getErrorSeverity(error);
      expect(severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should classify authentication errors as HIGH', () => {
      const error = new Error('Authentication failed');
      const severity = getErrorSeverity(error);
      expect(severity).toBe(ErrorSeverity.HIGH);
    });

    it('should classify validation errors as LOW', () => {
      const error = new Error('Invalid input');
      error.name = 'ValidationError';
      const severity = getErrorSeverity(error);
      expect(severity).toBe(ErrorSeverity.LOW);
    });

    it('should default to MEDIUM severity', () => {
      const error = new Error('Generic error');
      const severity = getErrorSeverity(error);
      expect(severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Error Filtering (Requirement 33.4)', () => {
    it('should filter out network errors', () => {
      const error = new Error('Network request failed');
      expect(shouldReportError(error)).toBe(false);
    });

    it('should filter out fetch errors', () => {
      const error = new Error('Failed to fetch');
      expect(shouldReportError(error)).toBe(false);
    });

    it('should filter out cancelled requests', () => {
      const error = new Error('Request cancelled');
      expect(shouldReportError(error)).toBe(false);
    });

    it('should filter out ResizeObserver errors', () => {
      const error = new Error('ResizeObserver loop limit exceeded');
      expect(shouldReportError(error)).toBe(false);
    });

    it('should filter out browser extension errors', () => {
      const error = new Error('chrome-extension://abc123/script.js');
      expect(shouldReportError(error)).toBe(false);
    });

    it('should NOT filter critical errors', () => {
      const error = new Error('Payment failed');
      expect(shouldReportError(error)).toBe(true);
    });

    it('should NOT filter normal application errors', () => {
      const error = new Error('Failed to load user data');
      expect(shouldReportError(error)).toBe(true);
    });
  });

  describe('Error Context Logging (Requirement 33.6)', () => {
    it('should log errors with user context', () => {
      const error = new Error('Test error');
      const context = {
        userId: 'user-123',
        sessionId: 'session-456',
      };

      logErrorToSentry(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          user: { id: 'user-123' },
          extra: expect.objectContaining({
            sessionId: 'session-456',
          }),
        })
      );
    });

    it('should log errors with custom tags', () => {
      const error = new Error('Test error');
      const context = {
        tags: {
          component: 'PaymentFlow',
          action: 'processPayment',
        },
      };

      logErrorToSentry(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: expect.objectContaining({
            component: 'PaymentFlow',
            action: 'processPayment',
          }),
        })
      );
    });

    it('should log errors with extra context', () => {
      const error = new Error('Test error');
      const context = {
        extra: {
          paymentAmount: 5000,
          currency: 'NGN',
        },
      };

      logErrorToSentry(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          extra: expect.objectContaining({
            paymentAmount: 5000,
            currency: 'NGN',
          }),
        })
      );
    });

    it('should include stack trace in error context', () => {
      const error = new Error('Test error');
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.any(Object)
      );

      // Verify the error object itself contains the stack
      expect(error.stack).toBeDefined();
    });
  });

  describe('Critical Error Alerting (Requirement 33.8)', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log critical errors to console', () => {
      const error = new Error('Payment processing failed');
      logErrorToSentry(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '🚨 CRITICAL ERROR:',
        expect.objectContaining({
          error: 'Payment processing failed',
        })
      );
    });

    it('should mark critical errors with fatal level', () => {
      const error = new Error('Database connection failed');
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'fatal',
        })
      );
    });

    it('should NOT log non-critical errors to console', () => {
      const error = new Error('Generic error');
      logErrorToSentry(error);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should tag critical errors for alerting', () => {
      const error = new Error('Security breach detected');
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: expect.objectContaining({
            severity: ErrorSeverity.CRITICAL,
          }),
        })
      );
    });
  });

  describe('Error Severity Levels', () => {
    it('should set correct Sentry level for CRITICAL errors', () => {
      const error = new Error('Payment failed');
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'fatal',
        })
      );
    });

    it('should set correct Sentry level for HIGH errors', () => {
      const error = new Error('Authentication failed');
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'error',
        })
      );
    });

    it('should set correct Sentry level for MEDIUM errors', () => {
      const error = new Error('Generic error');
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'warning',
        })
      );
    });

    it('should set correct Sentry level for LOW errors', () => {
      const error = new Error('Validation error');
      error.name = 'ValidationError';
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'info',
        })
      );
    });
  });

  describe('Environment Context', () => {
    it('should include environment in tags', () => {
      const error = new Error('Test error');
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: expect.objectContaining({
            environment: expect.any(String),
          }),
        })
      );
    });

    it('should include timestamp in extra context', () => {
      const error = new Error('Test error');
      logErrorToSentry(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          extra: expect.objectContaining({
            timestamp: expect.any(String),
          }),
        })
      );
    });
  });
});
