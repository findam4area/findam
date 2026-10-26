/**
 * Integration tests for GDPR API routes
 * Requirements: 31.6, 31.7, 31.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  })),
}));

describe('GDPR API Routes', () => {
  describe('Data Export API', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { GET } = await import('../export/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/export');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should export data in JSON format', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: vi.fn((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'test', name: 'Test' }, error: null }),
        })),
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { GET } = await import('../export/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/export?format=json');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain('findam-data-export');
      expect(response.headers.get('Content-Disposition')).toContain('.json');
    });

    it('should export data in CSV format', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: vi.fn((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'test', name: 'Test' }, error: null }),
        })),
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { GET } = await import('../export/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/export?format=csv');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('findam-data-export');
      expect(response.headers.get('Content-Disposition')).toContain('.csv');
    });

    it('should return 400 for invalid format', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { GET } = await import('../export/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/export?format=xml');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid format');
    });
  });

  describe('Data Deletion API', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { POST } = await import('../delete/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/delete', {
        method: 'POST',
        body: JSON.stringify({ action: 'schedule' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should schedule data deletion with default grace period', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: vi.fn(() => ({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { POST } = await import('../delete/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/delete', {
        method: 'POST',
        body: JSON.stringify({ action: 'schedule' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('scheduled successfully');
      expect(data.scheduledDate).toBeDefined();
    });

    it('should schedule data deletion with custom grace period', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: vi.fn(() => ({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { POST } = await import('../delete/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/delete', {
        method: 'POST',
        body: JSON.stringify({ action: 'schedule', gracePeriodDays: 7 }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.scheduledDate).toBeDefined();
      
      // Verify the scheduled date is approximately 7 days in the future
      const scheduledDate = new Date(data.scheduledDate);
      const now = new Date();
      const diffDays = Math.round((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(8);
    });

    it('should cancel scheduled deletion', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: vi.fn(() => ({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { POST } = await import('../delete/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/delete', {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('cancelled successfully');
    });

    it('should return 400 for invalid action', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const { POST } = await import('../delete/route');
      const request = new NextRequest('http://localhost:3000/api/gdpr/delete', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });
  });
});
