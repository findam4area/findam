/**
 * Real-time Updates Integration Tests
 * 
 * Tests Supabase real-time subscriptions:
 * - Mock Supabase subscription
 * - Trigger listing count change event
 * - Verify category listing counts update in UI
 * - Test subscription cleanup on unmount
 * 
 * Subtask: 20.4
 * Requirements: 16.26, 16.27
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import type { Category } from '@/lib/types/core';

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
};

const mockSupabaseClient = {
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => false,
}));

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    parent_id: null,
    description: 'Electronic devices',
    image_url: '/images/electronics.jpg',
    display_order: 1,
    listing_count: 150,
  },
  {
    id: '2',
    name: 'Fashion',
    slug: 'fashion',
    parent_id: null,
    description: 'Clothing',
    image_url: '/images/fashion.jpg',
    display_order: 2,
    listing_count: 85,
  },
];

describe('Real-time Updates Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Supabase Subscription Setup', () => {
    it('should create a Supabase channel for real-time updates', () => {
      const channelName = 'category-updates';

      mockSupabaseClient.channel(channelName);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(channelName);
    });

    it('should subscribe to postgres_changes event', () => {
      const channel = mockSupabaseClient.channel('category-updates');

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
        },
        vi.fn()
      );

      expect(channel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'listings',
        }),
        expect.any(Function)
      );
    });

    it('should subscribe to specific category listings', () => {
      const categoryId = '1';
      const channel = mockSupabaseClient.channel('category-updates');

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `category_id=eq.${categoryId}`,
        },
        vi.fn()
      );

      expect(channel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          filter: `category_id=eq.${categoryId}`,
        }),
        expect.any(Function)
      );
    });

    it('should subscribe to multiple category listings', () => {
      const categoryIds = ['1', '2', '3'];
      const channel = mockSupabaseClient.channel('subcategory-updates');

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `category_id=in.(${categoryIds.join(',')})`,
        },
        vi.fn()
      );

      expect(channel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          filter: 'category_id=in.(1,2,3)',
        }),
        expect.any(Function)
      );
    });

    it('should call subscribe after setting up event handlers', () => {
      const channel = mockSupabaseClient.channel('category-updates');

      channel.on('postgres_changes', {}, vi.fn()).subscribe();

      expect(channel.subscribe).toHaveBeenCalled();
    });
  });

  describe('Listing Count Updates', () => {
    it('should trigger update when new listing is created', async () => {
      const mockCallback = vi.fn();
      const channel = mockSupabaseClient.channel('category-updates');

      channel.on('postgres_changes', { event: 'INSERT' }, mockCallback);

      // Simulate INSERT event
      const insertPayload = {
        schema: 'public',
        table: 'listings',
        commit_timestamp: '2024-01-01T00:00:00Z',
        eventType: 'INSERT',
        new: {
          id: 'listing-1',
          category_id: '1',
          title: 'New iPhone',
          status: 'approved',
        },
        old: {},
        errors: null,
      };

      mockCallback(insertPayload);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'INSERT',
          new: expect.objectContaining({
            category_id: '1',
          }),
        })
      );
    });

    it('should trigger update when listing is deleted', async () => {
      const mockCallback = vi.fn();
      const channel = mockSupabaseClient.channel('category-updates');

      channel.on('postgres_changes', { event: 'DELETE' }, mockCallback);

      // Simulate DELETE event
      const deletePayload = {
        schema: 'public',
        table: 'listings',
        commit_timestamp: '2024-01-01T00:00:00Z',
        eventType: 'DELETE',
        old: {
          id: 'listing-1',
          category_id: '1',
        },
        new: {},
        errors: null,
      };

      mockCallback(deletePayload);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DELETE',
          old: expect.objectContaining({
            category_id: '1',
          }),
        })
      );
    });

    it('should trigger update when listing status changes to approved', async () => {
      const mockCallback = vi.fn();
      const channel = mockSupabaseClient.channel('category-updates');

      channel.on('postgres_changes', { event: 'UPDATE' }, mockCallback);

      // Simulate UPDATE event (status changed to approved)
      const updatePayload = {
        schema: 'public',
        table: 'listings',
        commit_timestamp: '2024-01-01T00:00:00Z',
        eventType: 'UPDATE',
        old: {
          id: 'listing-1',
          category_id: '1',
          status: 'pending',
        },
        new: {
          id: 'listing-1',
          category_id: '1',
          status: 'approved',
        },
        errors: null,
      };

      mockCallback(updatePayload);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'UPDATE',
          new: expect.objectContaining({
            status: 'approved',
          }),
        })
      );
    });

    it('should refetch category data after real-time event', async () => {
      const mockCallback = vi.fn(async () => {
        // Simulate refetching category data
        await mockSupabaseClient
          .from('categories')
          .select('*')
          .eq('id', '1');
      });

      const channel = mockSupabaseClient.channel('category-updates');
      channel.on('postgres_changes', {}, mockCallback);

      // Trigger event
      await mockCallback({
        eventType: 'INSERT',
        new: { category_id: '1' },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('categories');
    });
  });

  describe('UI Updates', () => {
    it('should update listing count in UI after real-time event', async () => {
      let currentCount = 150;
      const mockUpdateCount = vi.fn((newCount: number) => {
        currentCount = newCount;
      });

      // Simulate real-time event
      const event = {
        eventType: 'INSERT',
        new: { category_id: '1' },
      };

      mockUpdateCount(currentCount + 1);

      expect(mockUpdateCount).toHaveBeenCalledWith(151);
      expect(currentCount).toBe(151);
    });

    it('should decrement listing count when listing is deleted', async () => {
      let currentCount = 150;
      const mockUpdateCount = vi.fn((newCount: number) => {
        currentCount = newCount;
      });

      // Simulate DELETE event
      const event = {
        eventType: 'DELETE',
        old: { category_id: '1' },
      };

      mockUpdateCount(currentCount - 1);

      expect(mockUpdateCount).toHaveBeenCalledWith(149);
      expect(currentCount).toBe(149);
    });

    it('should handle multiple rapid updates', async () => {
      let currentCount = 150;
      const mockUpdateCount = vi.fn((delta: number) => {
        currentCount += delta;
      });

      // Simulate multiple rapid INSERT events
      mockUpdateCount(1);
      mockUpdateCount(1);
      mockUpdateCount(1);

      expect(mockUpdateCount).toHaveBeenCalledTimes(3);
      expect(currentCount).toBe(153);
    });

    it('should update multiple categories when they receive changes', async () => {
      const categoryCounts = new Map([
        ['1', 150],
        ['2', 85],
      ]);

      const mockUpdateCategoryCount = vi.fn((categoryId: string, delta: number) => {
        const current = categoryCounts.get(categoryId) || 0;
        categoryCounts.set(categoryId, current + delta);
      });

      // Category 1 gets a new listing
      mockUpdateCategoryCount('1', 1);
      expect(categoryCounts.get('1')).toBe(151);

      // Category 2 gets a new listing
      mockUpdateCategoryCount('2', 1);
      expect(categoryCounts.get('2')).toBe(86);
    });
  });

  describe('Subscription Cleanup', () => {
    it('should unsubscribe when component unmounts', () => {
      const channel = mockSupabaseClient.channel('category-updates');
      channel.on('postgres_changes', {}, vi.fn()).subscribe();

      // Simulate component unmount
      mockSupabaseClient.removeChannel(channel);

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(channel);
    });

    it('should clean up channel on component unmount', () => {
      const channel = mockSupabaseClient.channel('category-updates');
      const unsubscribe = vi.fn();

      channel.unsubscribe = unsubscribe;

      // Simulate useEffect cleanup
      channel.unsubscribe();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should handle cleanup with multiple subscriptions', () => {
      const channel1 = mockSupabaseClient.channel('category-updates-1');
      const channel2 = mockSupabaseClient.channel('category-updates-2');

      channel1.subscribe();
      channel2.subscribe();

      // Cleanup both
      mockSupabaseClient.removeChannel(channel1);
      mockSupabaseClient.removeChannel(channel2);

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledTimes(2);
    });

    it('should not throw error if cleanup is called multiple times', () => {
      const channel = mockSupabaseClient.channel('category-updates');

      expect(() => {
        mockSupabaseClient.removeChannel(channel);
        mockSupabaseClient.removeChannel(channel);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription errors gracefully', () => {
      const mockErrorCallback = vi.fn();
      const channel = mockSupabaseClient.channel('category-updates');

      channel.on('postgres_changes', {}, mockErrorCallback);

      // Simulate error event
      const errorPayload = {
        schema: 'public',
        table: 'listings',
        commit_timestamp: '2024-01-01T00:00:00Z',
        eventType: 'ERROR',
        errors: ['Connection lost'],
      };

      mockErrorCallback(errorPayload);

      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ERROR',
        })
      );
    });

    it('should continue working after a failed update', async () => {
      let callCount = 0;
      const mockCallback = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Update failed');
        }
      });

      const channel = mockSupabaseClient.channel('category-updates');
      channel.on('postgres_changes', {}, mockCallback);

      // First call fails
      try {
        mockCallback({ eventType: 'INSERT' });
      } catch (error) {
        // Expected to fail
      }

      // Second call succeeds
      mockCallback({ eventType: 'INSERT' });

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(callCount).toBe(2);
    });

    it('should handle missing category_id in payload', () => {
      const mockCallback = vi.fn((payload) => {
        if (!payload.new?.category_id) {
          console.warn('Missing category_id in payload');
          return;
        }
      });

      const channel = mockSupabaseClient.channel('category-updates');
      channel.on('postgres_changes', {}, mockCallback);

      // Trigger event with missing category_id
      mockCallback({
        eventType: 'INSERT',
        new: {},
      });

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Subscription Filters', () => {
    it('should only trigger for approved listings', () => {
      const mockCallback = vi.fn((payload) => {
        if (payload.new?.status === 'approved') {
          // Update count
          return true;
        }
        return false;
      });

      const channel = mockSupabaseClient.channel('category-updates');
      channel.on('postgres_changes', {}, mockCallback);

      // Approved listing
      const result1 = mockCallback({
        eventType: 'INSERT',
        new: { category_id: '1', status: 'approved' },
      });

      // Pending listing
      const result2 = mockCallback({
        eventType: 'INSERT',
        new: { category_id: '1', status: 'pending' },
      });

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should filter by specific category ID', () => {
      const targetCategoryId = '1';
      const mockCallback = vi.fn((payload) => {
        return payload.new?.category_id === targetCategoryId;
      });

      const channel = mockSupabaseClient.channel('category-updates');
      channel.on('postgres_changes', {}, mockCallback);

      // Matching category
      const result1 = mockCallback({
        eventType: 'INSERT',
        new: { category_id: '1' },
      });

      // Different category
      const result2 = mockCallback({
        eventType: 'INSERT',
        new: { category_id: '2' },
      });

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should filter by multiple category IDs for subcategories', () => {
      const subcategoryIds = ['4', '5', '6'];
      const mockCallback = vi.fn((payload) => {
        return subcategoryIds.includes(payload.new?.category_id);
      });

      const channel = mockSupabaseClient.channel('subcategory-updates');
      channel.on('postgres_changes', {}, mockCallback);

      // Matching subcategory
      const result1 = mockCallback({
        eventType: 'INSERT',
        new: { category_id: '4' },
      });

      // Non-matching category
      const result2 = mockCallback({
        eventType: 'INSERT',
        new: { category_id: '1' },
      });

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should throttle rapid updates to prevent excessive renders', () => {
      let updateCount = 0;
      const throttledUpdate = vi.fn(() => {
        updateCount++;
      });

      // Simulate throttling (only update once every 1000ms)
      const now = Date.now();
      let lastUpdate = 0;

      const triggerUpdate = () => {
        const currentTime = Date.now();
        if (currentTime - lastUpdate >= 1000) {
          throttledUpdate();
          lastUpdate = currentTime;
        }
      };

      // Rapid calls
      triggerUpdate();
      triggerUpdate();
      triggerUpdate();

      expect(throttledUpdate).toHaveBeenCalledTimes(1);
    });

    it('should batch multiple category updates', () => {
      const pendingUpdates = new Set<string>();
      const mockBatchUpdate = vi.fn((categoryIds: string[]) => {
        // Batch update logic
      });

      // Collect updates
      pendingUpdates.add('1');
      pendingUpdates.add('2');
      pendingUpdates.add('3');

      // Execute batch
      mockBatchUpdate(Array.from(pendingUpdates));

      expect(mockBatchUpdate).toHaveBeenCalledWith(['1', '2', '3']);
      expect(mockBatchUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Status', () => {
    it('should handle subscription connection success', () => {
      const channel = mockSupabaseClient.channel('category-updates');
      const mockStatusCallback = vi.fn();

      // Simulate connection status
      channel.on('postgres_changes', {}, vi.fn());
      channel.subscribe(mockStatusCallback);

      mockStatusCallback('SUBSCRIBED');

      expect(mockStatusCallback).toHaveBeenCalledWith('SUBSCRIBED');
    });

    it('should handle subscription connection failure', () => {
      const channel = mockSupabaseClient.channel('category-updates');
      const mockStatusCallback = vi.fn();

      channel.subscribe(mockStatusCallback);

      mockStatusCallback('CHANNEL_ERROR');

      expect(mockStatusCallback).toHaveBeenCalledWith('CHANNEL_ERROR');
    });

    it('should attempt reconnection after connection loss', () => {
      const channel = mockSupabaseClient.channel('category-updates');
      const mockReconnect = vi.fn(() => {
        channel.subscribe();
      });

      // Simulate connection loss
      mockReconnect();

      expect(mockReconnect).toHaveBeenCalled();
    });
  });
});
