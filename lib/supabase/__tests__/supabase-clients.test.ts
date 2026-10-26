/**
 * Tests for Supabase client configuration for Next.js 16
 * Validates Requirements 15.1, 15.8, 15.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Supabase Client Configuration', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  describe('Server Client', () => {
    it('should validate environment variables', async () => {
      // Remove required env var
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      // Dynamic import to get fresh module with cleared env
      const { createClient } = await import('../server');

      await expect(createClient()).rejects.toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      );
    });

    it('should validate URL format', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';

      const { createClient } = await import('../server');

      await expect(createClient()).rejects.toThrow('Invalid NEXT_PUBLIC_SUPABASE_URL format');
    });

    it('should create client with valid configuration', async () => {
      // Mock cookies
      vi.mock('next/headers', () => ({
        cookies: vi.fn(() =>
          Promise.resolve({
            getAll: vi.fn(() => []),
            set: vi.fn(),
          })
        ),
      }));

      const { createClient } = await import('../server');
      const client = await createClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });
  });

  describe('Client-side Client', () => {
    it('should create client with environment variables', () => {
      const { createClient } = require('../client');
      const client = createClient();

      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
    });
  });

  describe('Middleware Client', () => {
    it('should update session correctly', async () => {
      const { updateSession } = await import('../middleware');
      
      const mockRequest = {
        cookies: {
          getAll: vi.fn(() => []),
          set: vi.fn(),
        },
      } as any;

      const response = await updateSession(mockRequest);

      expect(response).toBeDefined();
    });
  });

  describe('Admin Client', () => {
    it('should require service role key', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { createAdminClient } = await import('../server');

      await expect(createAdminClient()).rejects.toThrow(
        'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
      );
    });
  });
});
