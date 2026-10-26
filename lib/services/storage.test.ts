/**
 * Unit tests for Storage Service
 * Tests Requirements: 13.3, 13.5, 13.6, 13.7, 13.8, 13.15
 * Task: 1.6 Create Supabase storage buckets with RLS policies
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from './storage';

// Mock Supabase client - defined before mock
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockList = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        list: mockList,
      })),
    },
  })),
}));

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    storageService = new StorageService();
    
    // Set mock environment variable
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  });

  describe('validateImage', () => {
    it('should validate valid JPEG image for listings bucket', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = storageService.validateImage(file, 'listings');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid PNG image for avatars bucket', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 512 * 1024 }); // 512KB

      const result = storageService.validateImage(file, 'avatars');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid WebP image for listings bucket', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB

      const result = storageService.validateImage(file, 'listings');

      expect(result.valid).toBe(true);
    });

    it('should reject image exceeding 2MB for avatars bucket', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 }); // 3MB

      const result = storageService.validateImage(file, 'avatars');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('2MB');
    });

    it('should reject image exceeding 5MB for listings bucket', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      const result = storageService.validateImage(file, 'listings');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('should reject unsupported file type', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = storageService.validateImage(file, 'listings');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject empty file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 0 });

      const result = storageService.validateImage(file, 'listings');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('uploadImage', () => {
    it('should upload image to avatars bucket with correct path structure', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      const userId = 'user-123';

      mockUpload.mockResolvedValue({
        data: { path: `${userId}/avatar-1234567890.webp` },
        error: null,
      });

      const result = await storageService.uploadImage(file, 'avatars', userId);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^${userId}/avatar-\\d+\\.webp$`)),
        file,
        expect.objectContaining({
          contentType: 'image/jpeg',
          upsert: false,
        })
      );
      expect(result.url).toContain('avatars');
      expect(result.path).toContain(userId);
      expect(result.size).toBe(1024 * 1024);
    });

    it('should upload image to listings bucket with correct path structure', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });
      const userId = 'user-123';
      const listingId = 'listing-456';
      const index = 2;

      mockUpload.mockResolvedValue({
        data: { path: `${userId}/${listingId}/image-${index}-1234567890.webp` },
        error: null,
      });

      const result = await storageService.uploadImage(
        file,
        'listings',
        userId,
        listingId,
        index
      );

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`^${userId}/${listingId}/image-${index}-\\d+\\.webp$`)
        ),
        file,
        expect.objectContaining({
          contentType: 'image/jpeg',
          upsert: false,
        })
      );
      expect(result.url).toContain('listings');
      expect(result.path).toContain(`${userId}/${listingId}`);
    });

    it('should throw error for invalid image', async () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 });

      await expect(
        storageService.uploadImage(file, 'listings', 'user-123', 'listing-456')
      ).rejects.toThrow('Invalid file type');
    });

    it('should throw error when listingId is missing for listings bucket', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      await expect(
        storageService.uploadImage(file, 'listings', 'user-123')
      ).rejects.toThrow('Listing ID is required');
    });

    it('should handle upload errors with user-friendly messages', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Payload too large' },
      });

      await expect(
        storageService.uploadImage(file, 'avatars', 'user-123')
      ).rejects.toThrow('Image too large');
    });

    it('should handle permission errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'not authorized' },
      });

      await expect(
        storageService.uploadImage(file, 'avatars', 'user-123')
      ).rejects.toThrow('permission');
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const imagePath = 'user-123/listing-456/image-1-1234567890.webp';

      mockRemove.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        storageService.deleteImage(imagePath, 'listings')
      ).resolves.toBeUndefined();

      expect(mockRemove).toHaveBeenCalledWith([imagePath]);
    });

    it('should handle deletion errors', async () => {
      const imagePath = 'user-123/listing-456/image-1-1234567890.webp';

      mockRemove.mockResolvedValue({
        data: null,
        error: { message: 'File not found' },
      });

      await expect(
        storageService.deleteImage(imagePath, 'listings')
      ).rejects.toThrow('File not found');
    });

    it('should handle permission errors on deletion', async () => {
      const imagePath = 'user-123/listing-456/image-1-1234567890.webp';

      mockRemove.mockResolvedValue({
        data: null,
        error: { message: 'not authorized' },
      });

      await expect(
        storageService.deleteImage(imagePath, 'listings')
      ).rejects.toThrow('permission');
    });
  });

  describe('getPublicUrl', () => {
    it('should generate correct public URL for listings bucket', () => {
      const imagePath = 'user-123/listing-456/image-1-1234567890.webp';

      const url = storageService.getPublicUrl(imagePath, 'listings');

      expect(url).toBe(
        'https://test.supabase.co/storage/v1/object/public/listings/user-123/listing-456/image-1-1234567890.webp'
      );
    });

    it('should generate correct public URL for avatars bucket', () => {
      const imagePath = 'user-123/avatar-1234567890.webp';

      const url = storageService.getPublicUrl(imagePath, 'avatars');

      expect(url).toBe(
        'https://test.supabase.co/storage/v1/object/public/avatars/user-123/avatar-1234567890.webp'
      );
    });

    it('should throw error when SUPABASE_URL is not configured', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => {
        storageService.getPublicUrl('test.jpg', 'avatars');
      }).toThrow('NEXT_PUBLIC_SUPABASE_URL is not configured');

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });
  });

  describe('extractPathFromUrl', () => {
    it('should extract path from listings bucket URL', () => {
      const url =
        'https://test.supabase.co/storage/v1/object/public/listings/user-123/listing-456/image-1-1234567890.webp';

      const path = storageService.extractPathFromUrl(url, 'listings');

      expect(path).toBe('user-123/listing-456/image-1-1234567890.webp');
    });

    it('should extract path from avatars bucket URL', () => {
      const url =
        'https://test.supabase.co/storage/v1/object/public/avatars/user-123/avatar-1234567890.webp';

      const path = storageService.extractPathFromUrl(url, 'avatars');

      expect(path).toBe('user-123/avatar-1234567890.webp');
    });

    it('should return null for invalid URL', () => {
      const url = 'not-a-valid-url';

      const path = storageService.extractPathFromUrl(url, 'listings');

      expect(path).toBeNull();
    });

    it('should return null when bucket not found in URL', () => {
      const url = 'https://test.supabase.co/storage/v1/object/public/other/image.jpg';

      const path = storageService.extractPathFromUrl(url, 'listings');

      expect(path).toBeNull();
    });
  });

  describe('listImages', () => {
    it('should list images in a folder', async () => {
      const folderPath = 'user-123/listing-456';
      const mockFiles = [
        { name: 'image-1-123.webp' },
        { name: 'image-2-456.webp' },
        { name: 'image-3-789.webp' },
      ];

      mockList.mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      const result = await storageService.listImages('listings', folderPath);

      expect(mockList).toHaveBeenCalledWith(folderPath);
      expect(result).toEqual([
        'user-123/listing-456/image-1-123.webp',
        'user-123/listing-456/image-2-456.webp',
        'user-123/listing-456/image-3-789.webp',
      ]);
    });

    it('should return empty array when folder is empty', async () => {
      const folderPath = 'user-123/listing-456';

      mockList.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await storageService.listImages('listings', folderPath);

      expect(result).toEqual([]);
    });

    it('should handle list errors', async () => {
      const folderPath = 'user-123/listing-456';

      mockList.mockResolvedValue({
        data: null,
        error: { message: 'Folder not found' },
      });

      await expect(
        storageService.listImages('listings', folderPath)
      ).rejects.toThrow('Folder not found');
    });
  });

  describe('deleteFolder', () => {
    it('should delete all images in a folder', async () => {
      const folderPath = 'user-123/listing-456';
      const mockFiles = [
        { name: 'image-1-123.webp' },
        { name: 'image-2-456.webp' },
      ];

      mockList.mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      mockRemove.mockResolvedValue({
        data: null,
        error: null,
      });

      await storageService.deleteFolder('listings', folderPath);

      expect(mockList).toHaveBeenCalledWith(folderPath);
      expect(mockRemove).toHaveBeenCalledWith([
        'user-123/listing-456/image-1-123.webp',
        'user-123/listing-456/image-2-456.webp',
      ]);
    });

    it('should do nothing when folder is empty', async () => {
      const folderPath = 'user-123/listing-456';

      mockList.mockResolvedValue({
        data: [],
        error: null,
      });

      await storageService.deleteFolder('listings', folderPath);

      expect(mockList).toHaveBeenCalledWith(folderPath);
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      const folderPath = 'user-123/listing-456';
      const mockFiles = [{ name: 'image-1-123.webp' }];

      mockList.mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      mockRemove.mockResolvedValue({
        data: null,
        error: { message: 'Deletion failed' },
      });

      await expect(
        storageService.deleteFolder('listings', folderPath)
      ).rejects.toThrow('Deletion failed');
    });
  });
});
