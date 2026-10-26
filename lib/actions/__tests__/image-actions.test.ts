/**
 * Unit tests for image upload Server Actions
 * 
 * Tests Requirements: 13.3, 13.6, 13.7, 13.8
 * Task: 6.2 Create image upload Server Actions (verification)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadImageAction, deleteImageAction, extractPathFromUrl } from '../image-actions';
import type { User } from '@/lib/types/core';

// Mock the auth service
vi.mock('@/lib/services/auth', () => ({
  requireAuth: vi.fn(),
  hasPermission: vi.fn(),
}));

// Mock the storage service
vi.mock('@/lib/services/storage', () => ({
  storageService: {
    validateImage: vi.fn(),
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
    extractPathFromUrl: vi.fn(),
  },
}));

describe('uploadImageAction', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    phone: null,
    full_name: 'Test User',
    avatar_url: null,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    const { requireAuth } = await import('@/lib/services/auth');
    const { storageService } = await import('@/lib/services/storage');

    // Mock authentication failure
    vi.mocked(requireAuth).mockRejectedValue(new Error('Authentication required'));

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const result = await uploadImageAction(formData, 'listings');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error when no file is provided', async () => {
    const { requireAuth } = await import('@/lib/services/auth');
    vi.mocked(requireAuth).mockResolvedValue(mockUser);

    const formData = new FormData();
    const result = await uploadImageAction(formData, 'listings');

    expect(result.success).toBe(false);
    expect(result.error).toBe('No file provided. Please select an image to upload.');
  });

  it('should return error when listing ID is missing for listings bucket', async () => {
    const { requireAuth } = await import('@/lib/services/auth');
    vi.mocked(requireAuth).mockResolvedValue(mockUser);

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const result = await uploadImageAction(formData, 'listings');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Listing ID is required for listing images.');
  });

  it('should validate image before uploading', async () => {
    const { requireAuth } = await import('@/lib/services/auth');
    const { storageService } = await import('@/lib/services/storage');

    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(storageService.validateImage).mockReturnValue({
      valid: false,
      error: 'File too large.',
    });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('file', file);
    formData.append('listingId', 'listing-123');

    const result = await uploadImageAction(formData, 'listings');

    expect(result.success).toBe(false);
    expect(result.error).toBe('File too large.');
    expect(storageService.validateImage).toHaveBeenCalledWith(file, 'listings');
  });

  it('should successfully upload a valid image', async () => {
    const { requireAuth } = await import('@/lib/services/auth');
    const { storageService } = await import('@/lib/services/storage');

    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(storageService.validateImage).mockReturnValue({ valid: true });
    vi.mocked(storageService.uploadImage).mockResolvedValue({
      url: 'https://example.com/image.jpg',
      path: 'user-123/listing-123/image-1-123456.webp',
      size: 1024,
    });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('file', file);
    formData.append('listingId', 'listing-123');
    formData.append('index', '1');

    const result = await uploadImageAction(formData, 'listings');

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result?.url).toBe('https://example.com/image.jpg');
    expect(result.result?.path).toBe('user-123/listing-123/image-1-123456.webp');
    expect(storageService.uploadImage).toHaveBeenCalledWith(
      file,
      'listings',
      mockUser.id,
      'listing-123',
      1
    );
  });

  it('should handle avatar uploads without listing ID', async () => {
    const { requireAuth } = await import('@/lib/services/auth');
    const { storageService } = await import('@/lib/services/storage');

    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(storageService.validateImage).mockReturnValue({ valid: true });
    vi.mocked(storageService.uploadImage).mockResolvedValue({
      url: 'https://example.com/avatar.jpg',
      path: 'user-123/avatar-123456.webp',
      size: 512,
    });

    const formData = new FormData();
    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const result = await uploadImageAction(formData, 'avatars');

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(storageService.uploadImage).toHaveBeenCalledWith(
      file,
      'avatars',
      mockUser.id,
      undefined,
      1
    );
  });
});

describe('deleteImageAction', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    phone: null,
    full_name: 'Test User',
    avatar_url: null,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    const { requireAuth } = await import('@/lib/services/auth');

    vi.mocked(requireAuth).mockRejectedValue(new Error('Authentication required'));

    const result = await deleteImageAction('user-123/listing-123/image.jpg', 'listings');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for invalid image path', async () => {
    const { requireAuth } = await import('@/lib/services/auth');
    vi.mocked(requireAuth).mockResolvedValue(mockUser);

    const result = await deleteImageAction('', 'listings');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid image path.');
  });

  it('should check authorization before deleting', async () => {
    const { requireAuth, hasPermission } = await import('@/lib/services/auth');

    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(hasPermission).mockReturnValue(false);

    const result = await deleteImageAction('other-user/listing-123/image.jpg', 'listings');

    expect(result.success).toBe(false);
    expect(result.error).toBe('You do not have permission to delete this image.');
    expect(hasPermission).toHaveBeenCalledWith(mockUser, 'other-user');
  });

  it('should successfully delete image when authorized', async () => {
    const { requireAuth, hasPermission } = await import('@/lib/services/auth');
    const { storageService } = await import('@/lib/services/storage');

    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(hasPermission).mockReturnValue(true);
    vi.mocked(storageService.deleteImage).mockResolvedValue(undefined);

    const imagePath = 'user-123/listing-123/image-1-123456.webp';
    const result = await deleteImageAction(imagePath, 'listings');

    expect(result.success).toBe(true);
    expect(storageService.deleteImage).toHaveBeenCalledWith(imagePath, 'listings');
  });

  it('should allow admin to delete any image', async () => {
    const { requireAuth, hasPermission } = await import('@/lib/services/auth');
    const { storageService } = await import('@/lib/services/storage');

    const adminUser: User = { ...mockUser, role: 'admin' };
    vi.mocked(requireAuth).mockResolvedValue(adminUser);
    vi.mocked(hasPermission).mockReturnValue(true);
    vi.mocked(storageService.deleteImage).mockResolvedValue(undefined);

    const imagePath = 'other-user/listing-123/image.jpg';
    const result = await deleteImageAction(imagePath, 'listings');

    expect(result.success).toBe(true);
    expect(hasPermission).toHaveBeenCalledWith(adminUser, 'other-user');
  });
});

describe('extractPathFromUrl', () => {
  it('should delegate to storageService', async () => {
    const { storageService } = await import('@/lib/services/storage');
    
    const url = 'https://example.com/storage/v1/object/public/listings/user/listing/image.jpg';
    const bucket = 'listings';

    extractPathFromUrl(url, bucket);

    expect(storageService.extractPathFromUrl).toHaveBeenCalledWith(url, bucket);
  });
});
