/**
 * Tests for Image Optimization Utilities
 * Requirements: 13.14, 13.15
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  IMAGE_SIZES,
  IMAGE_QUALITY,
  getImageSizes,
  validateImageFile,
  generateImageFilename,
  getImageQuality,
  isImageFile,
  formatFileSize,
  getFileExtension,
  getImageDimensions,
  exceedsMaxDimensions,
  type ImageContext,
  type StorageBucket,
} from './image';

describe('Image Utilities', () => {
  describe('Constants', () => {
    it('should have correct IMAGE_SIZES values', () => {
      expect(IMAGE_SIZES.thumbnail).toBe(200);
      expect(IMAGE_SIZES.card).toBe(400);
      expect(IMAGE_SIZES.detail).toBe(800);
      expect(IMAGE_SIZES.fullscreen).toBe(1920);
    });

    it('should have correct IMAGE_QUALITY values', () => {
      expect(IMAGE_QUALITY.thumbnail).toBe(75);
      expect(IMAGE_QUALITY.card).toBe(80);
      expect(IMAGE_QUALITY.detail).toBe(85);
      expect(IMAGE_QUALITY.fullscreen).toBe(90);
    });
  });

  describe('getImageSizes', () => {
    it('should return correct sizes string for thumbnail context', () => {
      const sizes = getImageSizes('thumbnail');
      expect(sizes).toBe('(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px');
    });

    it('should return correct sizes string for card context', () => {
      const sizes = getImageSizes('card');
      expect(sizes).toBe('(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px');
    });

    it('should return correct sizes string for detail context', () => {
      const sizes = getImageSizes('detail');
      expect(sizes).toBe('(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 800px');
    });

    it('should return correct sizes string for fullscreen context', () => {
      const sizes = getImageSizes('fullscreen');
      expect(sizes).toBe('100vw');
    });
  });

  describe('validateImageFile', () => {
    it('should validate JPEG images within size limit for listings', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      const result = validateImageFile(file, 'listings');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate PNG images within size limit for listings', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.png', {
        type: 'image/png',
      });
      const result = validateImageFile(file, 'listings');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate WebP images within size limit for listings', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.webp', {
        type: 'image/webp',
      });
      const result = validateImageFile(file, 'listings');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validateImageFile(file, 'listings');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
      expect(result.error).toContain('application/pdf');
    });

    it('should reject files exceeding listings size limit (5MB)', () => {
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      const result = validateImageFile(file, 'listings');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
      expect(result.error).toContain('5MB');
    });

    it('should reject files exceeding avatars size limit (2MB)', () => {
      const file = new File(['x'.repeat(3 * 1024 * 1024)], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      const result = validateImageFile(file, 'avatars');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
      expect(result.error).toContain('2MB');
    });

    it('should accept files within avatars size limit (2MB)', () => {
      const file = new File(['x'.repeat(1 * 1024 * 1024)], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      const result = validateImageFile(file, 'avatars');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty files', () => {
      const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file, 'listings');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File is empty');
    });

    it('should validate files at exact size limit', () => {
      const file = new File(['x'.repeat(5 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      const result = validateImageFile(file, 'listings');
      expect(result.valid).toBe(true);
    });
  });

  describe('generateImageFilename', () => {
    it('should generate filename with user ID and prefix', () => {
      const userId = 'user-123';
      const prefix = 'avatar';
      const filename = generateImageFilename(userId, prefix);
      
      expect(filename).toMatch(/^user-123\/avatar-\d+-[a-z0-9]+\.webp$/);
    });

    it('should generate filename with user ID without prefix', () => {
      const userId = 'user-456';
      const filename = generateImageFilename(userId);
      
      expect(filename).toMatch(/^user-456\/image-\d+-[a-z0-9]+\.webp$/);
    });

    it('should generate unique filenames on consecutive calls', () => {
      const userId = 'user-789';
      const prefix = 'listing';
      
      const filename1 = generateImageFilename(userId, prefix);
      const filename2 = generateImageFilename(userId, prefix);
      
      expect(filename1).not.toBe(filename2);
    });

    it('should always use .webp extension', () => {
      const filename = generateImageFilename('user-123', 'test');
      expect(filename).toMatch(/\.webp$/);
    });

    it('should include timestamp in filename', () => {
      const beforeTimestamp = Date.now();
      const filename = generateImageFilename('user-123', 'test');
      const afterTimestamp = Date.now();
      
      // Extract timestamp from filename (between prefix and random suffix)
      const match = filename.match(/test-(\d+)-/);
      expect(match).not.toBeNull();
      
      if (match) {
        const timestamp = parseInt(match[1], 10);
        expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
      }
    });

    it('should handle different user ID formats', () => {
      const userIds = ['user-123', 'abc-def-ghi', '12345', 'user_name_123'];
      
      userIds.forEach(userId => {
        const filename = generateImageFilename(userId, 'test');
        expect(filename).toMatch(new RegExp(`^${userId}/test-\\d+-[a-z0-9]+\\.webp$`));
      });
    });
  });

  describe('getImageQuality', () => {
    it('should return correct quality for thumbnail', () => {
      expect(getImageQuality('thumbnail')).toBe(75);
    });

    it('should return correct quality for card', () => {
      expect(getImageQuality('card')).toBe(80);
    });

    it('should return correct quality for detail', () => {
      expect(getImageQuality('detail')).toBe(85);
    });

    it('should return correct quality for fullscreen', () => {
      expect(getImageQuality('fullscreen')).toBe(90);
    });
  });

  describe('isImageFile', () => {
    it('should return true for image MIME types', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });
      
      expect(isImageFile(jpegFile)).toBe(true);
      expect(isImageFile(pngFile)).toBe(true);
      expect(isImageFile(webpFile)).toBe(true);
    });

    it('should return false for non-image MIME types', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });
      
      expect(isImageFile(pdfFile)).toBe(false);
      expect(isImageFile(textFile)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(512)).toBe('512.00 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatFileSize(3.75 * 1024 * 1024 * 1024)).toBe('3.75 GB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg');
      expect(getFileExtension('image.png')).toBe('png');
      expect(getFileExtension('photo.webp')).toBe('webp');
    });

    it('should handle files with multiple dots', () => {
      expect(getFileExtension('my.file.name.jpg')).toBe('jpg');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('noextension')).toBe('');
    });

    it('should convert extension to lowercase', () => {
      expect(getFileExtension('IMAGE.JPG')).toBe('jpg');
      expect(getFileExtension('Photo.PNG')).toBe('png');
    });
  });

  describe('getImageDimensions', () => {
    // Note: This test requires DOM environment with proper image support
    // Skip in test environment as it needs real image data and proper DOM APIs
    it.skip('should reject invalid image file', async () => {
      const file = new File(['invalid'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(getImageDimensions(file)).rejects.toThrow('Failed to load image');
    });

    // Skip actual dimension testing as it requires real image data
    // In a real test environment with jsdom, you would create actual image files
  });

  describe('exceedsMaxDimensions', () => {
    it('should return false for images within default limits', () => {
      expect(exceedsMaxDimensions(1920, 1080)).toBe(false);
      expect(exceedsMaxDimensions(4096, 4096)).toBe(false);
    });

    it('should return true for images exceeding default width limit', () => {
      expect(exceedsMaxDimensions(5000, 3000)).toBe(true);
    });

    it('should return true for images exceeding default height limit', () => {
      expect(exceedsMaxDimensions(3000, 5000)).toBe(true);
    });

    it('should return true for images exceeding both dimensions', () => {
      expect(exceedsMaxDimensions(5000, 5000)).toBe(true);
    });

    it('should respect custom max dimensions', () => {
      expect(exceedsMaxDimensions(2000, 1500, 1920, 1080)).toBe(true);
      expect(exceedsMaxDimensions(1920, 1080, 1920, 1080)).toBe(false);
      expect(exceedsMaxDimensions(1800, 1000, 1920, 1080)).toBe(false);
    });

    it('should handle edge case at exact limit', () => {
      expect(exceedsMaxDimensions(4096, 4096, 4096, 4096)).toBe(false);
      expect(exceedsMaxDimensions(4097, 4096, 4096, 4096)).toBe(true);
      expect(exceedsMaxDimensions(4096, 4097, 4096, 4096)).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should provide complete workflow for listing image upload', () => {
      const userId = 'user-123';
      const file = new File(['x'.repeat(2 * 1024 * 1024)], 'listing.jpg', {
        type: 'image/jpeg',
      });

      // Validate the file
      const validation = validateImageFile(file, 'listings');
      expect(validation.valid).toBe(true);

      // Generate filename
      const filename = generateImageFilename(userId, 'listing-456');
      expect(filename).toMatch(/^user-123\/listing-456-\d+-[a-z0-9]+\.webp$/);

      // Get sizes for card display
      const sizes = getImageSizes('card');
      expect(sizes).toContain('400px');

      // Get quality for card display
      const quality = getImageQuality('card');
      expect(quality).toBe(80);
    });

    it('should provide complete workflow for avatar upload', () => {
      const userId = 'user-789';
      const file = new File(['x'.repeat(1.5 * 1024 * 1024)], 'avatar.png', {
        type: 'image/png',
      });

      // Validate the file
      const validation = validateImageFile(file, 'avatars');
      expect(validation.valid).toBe(true);

      // Generate filename
      const filename = generateImageFilename(userId, 'avatar');
      expect(filename).toMatch(/^user-789\/avatar-\d+-[a-z0-9]+\.webp$/);

      // Get sizes for thumbnail display
      const sizes = getImageSizes('thumbnail');
      expect(sizes).toContain('200px');

      // Get quality for thumbnail display
      const quality = getImageQuality('thumbnail');
      expect(quality).toBe(75);
    });
  });
});
