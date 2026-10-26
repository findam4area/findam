/**
 * Tests for Admin Category Import API endpoint
 * 
 * Requirements: 19.1, 19.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => ({
  checkAdminAuth: vi.fn(),
}));

vi.mock('@/lib/parsers', () => ({
  parseCSVToCategories: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/auth/admin';
import { parseCSVToCategories } from '@/lib/parsers';

describe('POST /api/admin/categories/import', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock for Supabase client with proper chaining
    // The chain should support: from().select().eq().single(), from().insert().select().single(), etc.
    const createChainableMock = (): any => {
      const mock: any = {};
      
      // Define chainable methods that return the mock itself
      const chainableMethods = ['select', 'insert', 'update', 'eq', 'neq', 'gte', 'lte', 'in'];
      chainableMethods.forEach(method => {
        mock[method] = vi.fn((...args) => {
          // Special handling for select with count/head queries
          if (method === 'select' && args[1]?.count === 'exact' && args[1]?.head === true) {
            return Promise.resolve({ count: 0, error: null });
          }
          return mock;
        });
      });
      
      // Terminal methods that return promises
      mock.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
      mock.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      
      return mock;
    };

    // Create base mock with from method that returns chainable mock
    mockSupabase = {
      from: vi.fn(() => createChainableMock()),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      (checkAdminAuth as any).mockResolvedValue({
        isAdmin: false,
        error: 'Unauthorized',
      });

      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({ csv_data: 'test' }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not admin', async () => {
      (checkAdminAuth as any).mockResolvedValue({
        isAdmin: false,
        error: 'Forbidden',
      });

      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({ csv_data: 'test' }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Forbidden');
    });
  });

  describe('Request validation', () => {
    beforeEach(() => {
      (checkAdminAuth as any).mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-user-id' },
      });
    });

    it('should return 400 if csv_data is missing', async () => {
      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('csv_data');
    });

    it('should return 400 if csv_data is not a string', async () => {
      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({ csv_data: 123 }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('csv_data');
    });
  });

  describe('CSV validation', () => {
    beforeEach(() => {
      (checkAdminAuth as any).mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-user-id' },
      });
    });

    it('should return 400 with validation errors if CSV is invalid', async () => {
      const csvData = 'invalid,csv,data';
      
      (parseCSVToCategories as any).mockReturnValue({
        success: false,
        categories: [],
        errors: [
          { line: 1, error: 'Missing required headers: display_order' },
        ],
      });

      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({ csv_data: csvData }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.errors).toHaveLength(1);
      expect(json.errors[0].line).toBe(1);
    });
  });

  describe('Category insertion', () => {
    beforeEach(() => {
      (checkAdminAuth as any).mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-user-id' },
      });
    });

    it('should successfully insert new categories', async () => {
      const csvData = `name,parent_id,display_order,description,icon
Category1,,1,Description1,Icon1`;

      (parseCSVToCategories as any).mockReturnValue({
        success: true,
        categories: [
          {
            name: 'Category1',
            parent_id: null,
            display_order: 1,
            description: 'Description1',
            icon: 'Icon1',
          },
        ],
        errors: [],
      });

      // Override mockSupabase for this test
      let callCount = 0;
      mockSupabase.from = vi.fn((table) => {
        if (table === 'categories') {
          callCount++;
          
          if (callCount === 1) {
            // First call: check for existing categories
            return {
              select: vi.fn(() => Promise.resolve({ data: [], error: null })),
            };
          } else if (callCount === 2) {
            // Second call: insert new category
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: 'cat-id-1', name: 'Category1' },
                    error: null,
                  })),
                })),
              })),
            };
          } else {
            // Third call: refresh categories after insert
            return {
              select: vi.fn(() => Promise.resolve({
                data: [{ id: 'cat-id-1', name: 'Category1', parent_id: null }],
                error: null,
              })),
            };
          }
        }
        return {};
      });

      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({ csv_data: csvData }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.summary.inserted).toBe(1);
      expect(json.summary.errors).toBe(0);
    });

    it('should skip existing categories', async () => {
      const csvData = `name,parent_id,display_order,description,icon
ExistingCategory,,1,Description1,Icon1`;

      (parseCSVToCategories as any).mockReturnValue({
        success: true,
        categories: [
          {
            name: 'ExistingCategory',
            parent_id: null,
            display_order: 1,
            description: 'Description1',
            icon: 'Icon1',
          },
        ],
        errors: [],
      });

      // Override mockSupabase for this test
      let callCount = 0;
      mockSupabase.from = vi.fn((table) => {
        if (table === 'categories') {
          callCount++;
          
          if (callCount === 1) {
            // First call: existing categories check
            return {
              select: vi.fn(() => Promise.resolve({
                data: [{ id: 'existing-id', name: 'ExistingCategory', parent_id: null }],
                error: null,
              })),
            };
          } else if (callCount === 2) {
            // Second call: update existing category
            return {
              update: vi.fn(() => ({
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({
                      data: { id: 'existing-id', name: 'ExistingCategory' },
                      error: null,
                    })),
                  })),
                })),
              })),
            };
          } else {
            // Third call: refresh after update
            return {
              select: vi.fn(() => Promise.resolve({
                data: [{ id: 'existing-id', name: 'ExistingCategory', parent_id: null }],
                error: null,
              })),
            };
          }
        }
        return {};
      });

      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({ csv_data: csvData }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.summary.inserted).toBe(0);
      expect(json.summary.updated).toBe(1);
    });

    it('should handle insertion errors gracefully', async () => {
      const csvData = `name,parent_id,display_order,description,icon
Category1,,1,Description1,Icon1`;

      (parseCSVToCategories as any).mockReturnValue({
        success: true,
        categories: [
          {
            name: 'Category1',
            parent_id: null,
            display_order: 1,
            description: 'Description1',
            icon: 'Icon1',
          },
        ],
        errors: [],
      });

      // Override mockSupabase for this test
      let callCount = 0;
      mockSupabase.from = vi.fn((table) => {
        if (table === 'categories') {
          callCount++;
          
          if (callCount === 1) {
            // First call: check for existing categories
            return {
              select: vi.fn(() => Promise.resolve({ data: [], error: null })),
            };
          } else if (callCount === 2) {
            // Second call: insert fails
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: null,
                    error: { message: 'Database constraint violation' },
                  })),
                })),
              })),
            };
          } else {
            // Third call: refresh after failed insert
            return {
              select: vi.fn(() => Promise.resolve({ data: [], error: null })),
            };
          }
        }
        return {};
      });

      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({ csv_data: csvData }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(207); // Multi-status for partial failure
      expect(json.success).toBe(false);
      expect(json.summary.errors).toBe(1);
      expect(json.errors).toHaveLength(1);
    });

    it('should handle subcategories with parent references', async () => {
      const csvData = `name,parent_id,display_order,description,icon
MainCategory,,1,Main Description,Icon1
SubCategory,MainCategory,1,Sub Description,`;

      (parseCSVToCategories as any).mockReturnValue({
        success: true,
        categories: [
          {
            name: 'MainCategory',
            parent_id: null,
            display_order: 1,
            description: 'Main Description',
            icon: 'Icon1',
          },
          {
            name: 'SubCategory',
            parent_id: 'MainCategory',
            display_order: 1,
            description: 'Sub Description',
          },
        ],
        errors: [],
      });

      // Override mockSupabase for this test
      let callCount = 0;
      mockSupabase.from = vi.fn((table) => {
        if (table === 'categories') {
          callCount++;
          
          if (callCount === 1) {
            // First call: check for existing categories (none)
            return {
              select: vi.fn(() => Promise.resolve({ data: [], error: null })),
            };
          } else if (callCount === 2) {
            // Second call: insert main category
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: 'main-id', name: 'MainCategory' },
                    error: null,
                  })),
                })),
              })),
            };
          } else if (callCount === 3) {
            // Third call: refresh categories after main insert
            return {
              select: vi.fn(() => Promise.resolve({
                data: [{ id: 'main-id', name: 'MainCategory', parent_id: null }],
                error: null,
              })),
            };
          } else if (callCount === 4) {
            // Fourth call: insert subcategory
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: 'sub-id', name: 'SubCategory' },
                    error: null,
                  })),
                })),
              })),
            };
          }
        }
        return {};
      });

      const request = new NextRequest('http://localhost/api/admin/categories/import', {
        method: 'POST',
        body: JSON.stringify({ csv_data: csvData }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.summary.inserted).toBe(2);
      expect(json.summary.errors).toBe(0);
    });
  });
});
