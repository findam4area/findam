/**
 * Unit Tests for Listing Server Actions
 * 
 * Tests for:
 * - createListingAction: authentication, validation, creation, revalidation
 * - updateListingImagesAction: authentication, authorization, validation, updates
 * 
 * Requirements: 3.1, 13.9, 13.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createListingAction, updateListingImagesAction } from './listing-actions';

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('createListingAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail when user is not authenticated', async () => {
    // Mock unauthenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const formData = new FormData();
    formData.set('title', 'Test Listing');
    formData.set('description', 'Test description with enough characters');
    formData.set('category_id', '123e4567-e89b-12d3-a456-426614174000');
    formData.set('location_state', 'Lagos');
    formData.set('location_city', 'Ikeja');
    formData.set('images', JSON.stringify(['https://example.com/image1.jpg']));
    formData.set('primary_image_index', '0');

    const result = await createListingAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('should fail when title is too short', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const formData = new FormData();
    formData.set('title', 'Test'); // Too short (min 5 chars)
    formData.set('description', 'Test description with enough characters');
    formData.set('category_id', '123e4567-e89b-12d3-a456-426614174000');
    formData.set('location_state', 'Lagos');
    formData.set('location_city', 'Ikeja');
    formData.set('images', JSON.stringify(['https://example.com/image1.jpg']));
    formData.set('primary_image_index', '0');

    const result = await createListingAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 5 characters');
  });

  it('should fail when description is too short', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const formData = new FormData();
    formData.set('title', 'Test Listing');
    formData.set('description', 'Too short'); // Too short (min 20 chars)
    formData.set('category_id', '123e4567-e89b-12d3-a456-426614174000');
    formData.set('location_state', 'Lagos');
    formData.set('location_city', 'Ikeja');
    formData.set('images', JSON.stringify(['https://example.com/image1.jpg']));
    formData.set('primary_image_index', '0');

    const result = await createListingAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 20 characters');
  });

  it('should fail when no images are provided', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const formData = new FormData();
    formData.set('title', 'Test Listing');
    formData.set('description', 'Test description with enough characters');
    formData.set('category_id', '123e4567-e89b-12d3-a456-426614174000');
    formData.set('location_state', 'Lagos');
    formData.set('location_city', 'Ikeja');
    formData.set('images', JSON.stringify([])); // Empty array
    formData.set('primary_image_index', '0');

    const result = await createListingAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('At least 1 image');
  });

  it('should fail when more than 5 images are provided', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const formData = new FormData();
    formData.set('title', 'Test Listing');
    formData.set('description', 'Test description with enough characters');
    formData.set('category_id', '123e4567-e89b-12d3-a456-426614174000');
    formData.set('location_state', 'Lagos');
    formData.set('location_city', 'Ikeja');
    formData.set('images', JSON.stringify([
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
      'https://example.com/4.jpg',
      'https://example.com/5.jpg',
      'https://example.com/6.jpg', // 6 images - too many
    ]));
    formData.set('primary_image_index', '0');

    const result = await createListingAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum 5 images');
  });

  it('should fail when primary_image_index is out of bounds', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const formData = new FormData();
    formData.set('title', 'Test Listing');
    formData.set('description', 'Test description with enough characters');
    formData.set('category_id', '123e4567-e89b-12d3-a456-426614174000');
    formData.set('location_state', 'Lagos');
    formData.set('location_city', 'Ikeja');
    formData.set('images', JSON.stringify([
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
    ]));
    formData.set('primary_image_index', '5'); // Out of bounds

    const result = await createListingAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/within|at most 4/);
  });

  it('should successfully create a listing with valid data', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock successful insert
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'listing-123' },
          error: null,
        }),
      }),
    });

    mockSupabaseClient.from.mockReturnValue({
      insert: mockInsert,
    });

    const formData = new FormData();
    formData.set('title', 'Test Listing');
    formData.set('description', 'Test description with enough characters to meet validation');
    formData.set('price', '100');
    formData.set('category_id', '123e4567-e89b-12d3-a456-426614174000');
    formData.set('location_state', 'Lagos');
    formData.set('location_city', 'Ikeja');
    formData.set('images', JSON.stringify([
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
    ]));
    formData.set('primary_image_index', '0');

    const result = await createListingAction(formData);

    expect(result.success).toBe(true);
    expect(result.data).toBe('listing-123');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Listing',
        user_id: 'user-123',
        status: 'pending',
        images: expect.arrayContaining([
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
        ]),
        primary_image_index: 0,
      })
    );
  });

  it('should create listing with null price for free items', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock successful insert
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'listing-123' },
          error: null,
        }),
      }),
    });

    mockSupabaseClient.from.mockReturnValue({
      insert: mockInsert,
    });

    const formData = new FormData();
    formData.set('title', 'Free Item Listing');
    formData.set('description', 'Test description with enough characters for validation');
    formData.set('price', ''); // Empty price for free item
    formData.set('category_id', '123e4567-e89b-12d3-a456-426614174000');
    formData.set('location_state', 'Lagos');
    formData.set('location_city', 'Ikeja');
    formData.set('images', JSON.stringify(['https://example.com/1.jpg']));
    formData.set('primary_image_index', '0');

    const result = await createListingAction(formData);

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        price: null,
      })
    );
  });
});

describe('updateListingImagesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail when user is not authenticated', async () => {
    // Mock unauthenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const result = await updateListingImagesAction(
      '123e4567-e89b-12d3-a456-426614174000',
      ['https://example.com/1.jpg'],
      0
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('should fail when listing ID is invalid', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const result = await updateListingImagesAction(
      '',
      ['https://example.com/1.jpg'],
      0
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid listing ID');
  });

  it('should fail when images array is empty', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const result = await updateListingImagesAction(
      '123e4567-e89b-12d3-a456-426614174000',
      [], // Empty array
      0
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('At least 1 image');
  });

  it('should fail when more than 5 images are provided', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const result = await updateListingImagesAction(
      '123e4567-e89b-12d3-a456-426614174000',
      [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
        'https://example.com/6.jpg', // Too many
      ],
      0
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum 5 images');
  });

  it('should fail when primary index is out of bounds', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const result = await updateListingImagesAction(
      '123e4567-e89b-12d3-a456-426614174000',
      [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
      ],
      5 // Out of bounds
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/less than|at most 4/);
  });

  it('should fail when listing does not exist', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock listing not found
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      }),
    });

    const result = await updateListingImagesAction(
      '123e4567-e89b-12d3-a456-426614174000',
      ['https://example.com/1.jpg'],
      0
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should fail when user does not own the listing', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock listing owned by different user
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'listing-123',
              user_id: 'different-user',
            },
            error: null,
          }),
        }),
      }),
    });

    const result = await updateListingImagesAction(
      '123e4567-e89b-12d3-a456-426614174000',
      ['https://example.com/1.jpg'],
      0
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('permission');
  });

  it('should successfully update listing images when authorized', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock listing fetch (user owns the listing)
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'listing-123',
            user_id: 'user-123', // Same user
          },
          error: null,
        }),
      }),
    });

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'listings') {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
    });

    const newImages = [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
    ];

    const result = await updateListingImagesAction(
      'listing-123',
      newImages,
      1 // Set second image as primary
    );

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        images: newImages,
        primary_image_index: 1,
      })
    );
  });
});
