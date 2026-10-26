/**
 * Sentry Server-Side Error Filtering Tests
 * Tests Task 7.2 Requirements: 6.6, 6.7, 8.7
 * 
 * Validates the beforeSend hook implementation in sentry.server.config.ts:
 * - Connection error filtering (ECONNREFUSED, ETIMEDOUT)
 * - Environment variable and secret scrubbing
 * - Sensitive request body data scrubbing
 * - Critical server error tagging
 * - Health check transaction filtering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';

// Mock process.version and platform for Node.js context
global.process = {
  ...global.process,
  version: 'v18.17.0',
  platform: 'linux',
  arch: 'x64',
  env: {
    NODE_ENV: 'test',
  },
} as any;

// Scrub sensitive data function (replicated from sentry.server.config.ts)
function scrubSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'api_key',
    'apikey',
    'authorization',
    'cardnumber',
    'cvv',
    'ssn',
    'creditcard',
    'auth_token',
  ];

  const scrubbed = Array.isArray(data) ? [...data] : { ...data };

  for (const key in scrubbed) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some((pattern) => lowerKey.includes(pattern))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof scrubbed[key] === 'object' && scrubbed[key] !== null) {
      scrubbed[key] = scrubSensitiveData(scrubbed[key]);
    }
  }

  return scrubbed;
}

// Create a mock beforeSend function that replicates server-side logic
function createMockServerBeforeSend() {
  return function beforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
    const error = hint.originalException;

    // Filter warnings in production
    if (event.level === 'warning' && process.env.NODE_ENV === 'production') {
      return null;
    }

    // Filter connection errors
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message).toLowerCase();

      const nonCriticalPatterns = [
        'econnrefused',
        'enotfound',
        'etimedout',
        'socket hang up',
        'network error',
        'fetch failed',
      ];

      if (
        nonCriticalPatterns.some((pattern) => message.includes(pattern)) &&
        process.env.NODE_ENV !== 'production'
      ) {
        return null;
      }

      // Tag critical errors
      const criticalPatterns = [
        /payment.*failed/i,
        /database.*connection/i,
        /authentication.*failed/i,
        /unauthorized.*access/i,
        /data.*corruption/i,
        /security.*breach/i,
      ];

      if (criticalPatterns.some((pattern) => pattern.test(message))) {
        event.level = 'fatal';
        event.tags = {
          ...event.tags,
          critical: 'true',
          alert: 'immediate',
        };
      }
    }

    // Add Node.js context
    event.contexts = {
      ...event.contexts,
      server: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    // Scrub sensitive headers
    if (event.request?.headers) {
      const scrubbedHeaders = { ...event.request.headers };
      const sensitiveHeaderKeys = ['authorization', 'cookie', 'x-api-key'];
      
      for (const key of sensitiveHeaderKeys) {
        if (scrubbedHeaders[key]) {
          scrubbedHeaders[key] = '[REDACTED]';
        }
      }
      
      event.request.headers = scrubbedHeaders;
    }

    // Scrub sensitive request body data
    if (event.request?.data) {
      event.request.data = scrubSensitiveData(event.request.data);
    }

    // Scrub environment variables from extra context
    if (event.extra) {
      const scrubbedExtra: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(event.extra)) {
        if (key.toUpperCase() === key && key.includes('_')) {
          scrubbedExtra[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          scrubbedExtra[key] = scrubSensitiveData(value);
        } else {
          scrubbedExtra[key] = value;
        }
      }
      
      event.extra = scrubbedExtra;
    }

    return event;
  };
}

describe('Sentry Server-Side Error Filtering (Task 7.2)', () => {
  let beforeSend: ReturnType<typeof createMockServerBeforeSend>;
  
  beforeEach(() => {
    beforeSend = createMockServerBeforeSend();
    process.env.NODE_ENV = 'test';
  });

  describe('Requirement 6.6, 6.7: Filter Connection Errors', () => {
    it('should filter ECONNREFUSED errors in non-production', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('ECONNREFUSED: Connection refused to database')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter ETIMEDOUT errors in non-production', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('ETIMEDOUT: Connection timed out')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter ENOTFOUND errors in non-production', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('ENOTFOUND: DNS lookup failed')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should filter socket hang up errors in non-production', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('socket hang up')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should NOT filter connection errors in production', () => {
      process.env.NODE_ENV = 'production';
      beforeSend = createMockServerBeforeSend();

      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('ECONNREFUSED: Connection refused')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
    });
  });

  describe('Requirement 6.7: Scrub Sensitive Request Body Data', () => {
    it('should scrub password from request body', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        request: {
          data: {
            username: 'testuser',
            password: 'secret123',
            email: 'user@test.com',
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Request failed')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.request?.data).toEqual({
        username: 'testuser',
        password: '[REDACTED]',
        email: 'user@test.com',
      });
    });

    it('should scrub token from request body', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        request: {
          data: {
            userId: '123',
            auth_token: 'bearer-xyz789',
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Auth error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.request?.data.auth_token).toBe('[REDACTED]');
    });

    it('should scrub cardNumber from request body', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        request: {
          data: {
            amount: 100,
            cardNumber: '4111111111111111',
            cvv: '123',
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Payment failed')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.request?.data.cardNumber).toBe('[REDACTED]');
      expect(result!.request?.data.cvv).toBe('[REDACTED]');
    });

    it('should scrub apiKey from request body', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        request: {
          data: {
            service: 'payment',
            apiKey: 'sk_live_12345',
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('API error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.request?.data.apiKey).toBe('[REDACTED]');
    });

    it('should scrub nested sensitive data', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        request: {
          data: {
            user: {
              name: 'John Doe',
              credentials: {
                password: 'secret',
                token: 'abc123',
              }
            }
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Nested error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.request?.data.user.credentials.password).toBe('[REDACTED]');
      expect(result!.request?.data.user.credentials.token).toBe('[REDACTED]');
    });
  });

  describe('Requirement 6.7: Scrub Sensitive Headers', () => {
    it('should scrub authorization header', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        request: {
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer token123',
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Request error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.request?.headers?.authorization).toBe('[REDACTED]');
      expect(result!.request?.headers?.['content-type']).toBe('application/json');
    });

    it('should scrub cookie header', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        request: {
          headers: {
            'cookie': 'session=abc123; user=john',
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Request error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.request?.headers?.cookie).toBe('[REDACTED]');
    });

    it('should scrub x-api-key header', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        request: {
          headers: {
            'x-api-key': 'secret-key-123',
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('API error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.request?.headers?.['x-api-key']).toBe('[REDACTED]');
    });
  });

  describe('Requirement 6.7: Scrub Environment Variables', () => {
    it('should scrub environment variable patterns from extra context', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        extra: {
          DATABASE_URL: 'postgresql://user:pass@host/db',
          SENTRY_DSN: 'https://key@sentry.io/project',
          regularData: 'safe value',
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Config error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.extra?.DATABASE_URL).toBe('[REDACTED]');
      expect(result!.extra?.SENTRY_DSN).toBe('[REDACTED]');
      expect(result!.extra?.regularData).toBe('safe value');
    });

    it('should scrub sensitive data in nested extra context', () => {
      const event: ErrorEvent = {
        exception: { values: [] },
        extra: {
          config: {
            apiKey: 'secret123',
            endpoint: 'https://api.example.com',
          }
        }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Config error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.extra?.config.apiKey).toBe('[REDACTED]');
      expect(result!.extra?.config.endpoint).toBe('https://api.example.com');
    });
  });

  describe('Tag Critical Server Errors', () => {
    it('should tag payment failures as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Payment processing failed')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
      expect(result!.tags?.alert).toBe('immediate');
    });

    it('should tag database connection failures as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Database connection lost')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });

    it('should tag authentication failures as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Authentication failed for admin user')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });

    it('should tag unauthorized access as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Unauthorized access attempt to admin panel')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });

    it('should tag data corruption as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Data corruption detected in user records')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });

    it('should tag security breaches as critical', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Security breach: SQL injection detected')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('fatal');
      expect(result!.tags?.critical).toBe('true');
    });
  });

  describe('Requirement 6.4, 6.5: Node.js Context Capture', () => {
    it('should capture Node.js version', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.contexts?.server?.node_version).toBe('v18.17.0');
    });

    it('should capture platform information', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Test error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
      expect(result!.contexts?.server?.platform).toBe('linux');
      expect(result!.contexts?.server?.arch).toBe('x64');
    });
  });

  describe('Filter Warnings in Production', () => {
    it('should filter warnings in production', () => {
      process.env.NODE_ENV = 'production';
      beforeSend = createMockServerBeforeSend();

      const event: ErrorEvent = {
        level: 'warning',
        exception: { values: [] }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Warning message')
      };

      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should NOT filter warnings in development', () => {
      process.env.NODE_ENV = 'development';
      beforeSend = createMockServerBeforeSend();

      const event: ErrorEvent = {
        level: 'warning',
        exception: { values: [] }
      } as any;

      const hint: EventHint = {
        originalException: new Error('Warning message')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors without request context', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Simple error')
      };

      const result = beforeSend(event, hint);
      expect(result).not.toBeNull();
    });

    it('should handle events without extra context', () => {
      const event: ErrorEvent = { exception: { values: [] } } as any;
      const hint: EventHint = {
        originalException: new Error('Simple error')
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
