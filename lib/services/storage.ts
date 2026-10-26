/**
 * Storage Service for Supabase Storage Operations
 * Implements Requirements: 13.3, 13.5, 13.6, 13.7, 13.8, 13.15, 15.5, 15.10
 * Task: 1.6 Create Supabase storage buckets with RLS policies
 * 
 * This service handles:
 * - Image upload to avatars and listings buckets
 * - Image deletion with authorization
 * - Public URL generation
 * - Image validation (type and size)
 * - Path structure: listings/{user_id}/{listing_id}/image-{index}-{timestamp}.webp
 *                   avatars/{user_id}/avatar-{timestamp}.webp
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Result of a successful image upload
 */
export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
}

/**
 * Result of image validation
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Supported storage buckets
 */
export type StorageBucket = 'avatars' | 'listings';

/**
 * Storage bucket configuration
 */
const BUCKET_CONFIG = {
  avatars: {
    name: 'avatars',
    maxSizeMB: 2,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  listings: {
    name: 'listings',
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
} as const;

/**
 * Storage service implementation
 */
export class StorageService {
  /**
   * Upload an image to a storage bucket
   * 
   * @param file - File to upload
   * @param bucket - Target bucket ('avatars' or 'listings')
   * @param userId - User ID for path structure
   * @param listingId - Optional listing ID (required for listings bucket)
   * @param index - Optional image index for listings (default: 1)
   * @returns Upload result with URL, path, and size
   * @throws Error if upload fails
   * 
   * @example
   * ```typescript
   * const result = await storageService.uploadImage(
   *   file,
   *   'listings',
   *   userId,
   *   listingId,
   *   1
   * );
   * console.log('Uploaded to:', result.url);
   * ```
   */
  async uploadImage(
    file: File,
    bucket: StorageBucket,
    userId: string,
    listingId?: string,
    index: number = 1
  ): Promise<ImageUploadResult> {
    // Validate image
    const validation = this.validateImage(file, bucket);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image');
    }

    // Generate file path based on bucket and structure
    const timestamp = Date.now();
    let filePath: string;

    if (bucket === 'avatars') {
      filePath = `${userId}/avatar-${timestamp}.webp`;
    } else if (bucket === 'listings') {
      if (!listingId) {
        throw new Error('Listing ID is required for listings bucket uploads');
      }
      filePath = `${userId}/${listingId}/image-${index}-${timestamp}.webp`;
    } else {
      throw new Error(`Unsupported bucket: ${bucket}`);
    }

    // Upload to Supabase storage
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error(`Storage upload error (${bucket}):`, error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Payload too large')) {
        throw new Error(
          `Image too large. Maximum size is ${BUCKET_CONFIG[bucket].maxSizeMB}MB.`
        );
      }
      if (error.message.includes('Invalid mime type')) {
        throw new Error(
          `Invalid image type. Allowed types: ${BUCKET_CONFIG[bucket].allowedTypes.join(', ')}`
        );
      }
      if (error.message.includes('permission') || error.message.includes('not authorized')) {
        throw new Error('You do not have permission to upload to this location.');
      }
      
      throw new Error(error.message || 'Failed to upload image. Please try again.');
    }

    // Get public URL
    const publicUrl = this.getPublicUrl(data.path, bucket);

    return {
      url: publicUrl,
      path: data.path,
      size: file.size,
    };
  }

  /**
   * Delete an image from a storage bucket
   * 
   * @param imagePath - Path to the image in storage
   * @param bucket - Storage bucket
   * @throws Error if deletion fails
   * 
   * @example
   * ```typescript
   * await storageService.deleteImage(
   *   'user-id/listing-id/image-1-123456.webp',
   *   'listings'
   * );
   * ```
   */
  async deleteImage(imagePath: string, bucket: StorageBucket): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([imagePath]);

    if (error) {
      console.error(`Storage deletion error (${bucket}):`, error);
      
      // Provide user-friendly error messages
      if (error.message.includes('permission') || error.message.includes('not authorized')) {
        throw new Error('You do not have permission to delete this image.');
      }
      
      throw new Error(error.message || 'Failed to delete image. Please try again.');
    }
  }

  /**
   * Get public URL for an image
   * 
   * @param imagePath - Path to the image in storage
   * @param bucket - Storage bucket
   * @returns Public URL for the image
   * 
   * @example
   * ```typescript
   * const url = storageService.getPublicUrl(
   *   'user-id/listing-id/image-1-123456.webp',
   *   'listings'
   * );
   * ```
   */
  getPublicUrl(imagePath: string, bucket: StorageBucket): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
    }

    // Construct public URL following Supabase storage URL pattern
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${imagePath}`;
  }

  /**
   * Validate image file before upload
   * 
   * @param file - File to validate
   * @param bucket - Target bucket (determines size and type limits)
   * @returns Validation result with error message if invalid
   * 
   * @example
   * ```typescript
   * const validation = storageService.validateImage(file, 'listings');
   * if (!validation.valid) {
   *   console.error(validation.error);
   * }
   * ```
   */
  validateImage(file: File, bucket: StorageBucket): ImageValidationResult {
    const config = BUCKET_CONFIG[bucket];

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Only ${config.allowedTypes.join(', ')} are allowed.`,
      };
    }

    // Check file size
    const maxSizeBytes = config.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${config.maxSizeMB}MB.`,
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty.',
      };
    }

    return { valid: true };
  }

  /**
   * Extract path components from an image URL
   * Useful for extracting user_id, listing_id from public URLs
   * 
   * @param url - Public URL of the image
   * @param bucket - Storage bucket
   * @returns Path relative to bucket root, or null if invalid URL
   * 
   * @example
   * ```typescript
   * const path = storageService.extractPathFromUrl(
   *   'https://project.supabase.co/storage/v1/object/public/listings/user-id/listing-id/image.webp',
   *   'listings'
   * );
   * // Returns: 'user-id/listing-id/image.webp'
   * ```
   */
  extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Expected format: /storage/v1/object/public/{bucket}/{path}
      const bucketIndex = pathParts.indexOf(bucket);
      if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
        return null;
      }
      
      // Join path components after bucket name
      const relativePath = pathParts.slice(bucketIndex + 1).join('/');
      return relativePath || null;
    } catch {
      return null;
    }
  }

  /**
   * List images in a specific folder
   * Useful for fetching all images for a listing or user
   * 
   * @param bucket - Storage bucket
   * @param folderPath - Path to folder (e.g., 'user-id/listing-id')
   * @returns Array of file paths
   * @throws Error if listing fails
   * 
   * @example
   * ```typescript
   * const images = await storageService.listImages(
   *   'listings',
   *   `${userId}/${listingId}`
   * );
   * ```
   */
  async listImages(bucket: StorageBucket, folderPath: string): Promise<string[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath);

    if (error) {
      console.error(`Storage list error (${bucket}):`, error);
      throw new Error(error.message || 'Failed to list images.');
    }

    // Return file paths
    return data?.map(file => `${folderPath}/${file.name}`) || [];
  }

  /**
   * Delete all images in a folder
   * Useful when deleting a listing or user account
   * 
   * @param bucket - Storage bucket
   * @param folderPath - Path to folder to delete
   * @throws Error if deletion fails
   * 
   * @example
   * ```typescript
   * await storageService.deleteFolder(
   *   'listings',
   *   `${userId}/${listingId}`
   * );
   * ```
   */
  async deleteFolder(bucket: StorageBucket, folderPath: string): Promise<void> {
    // List all files in folder
    const images = await this.listImages(bucket, folderPath);
    
    if (images.length === 0) {
      return; // Nothing to delete
    }

    // Delete all files
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from(bucket)
      .remove(images);

    if (error) {
      console.error(`Storage folder deletion error (${bucket}):`, error);
      throw new Error(error.message || 'Failed to delete folder.');
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export types
export type { StorageBucket, ImageUploadResult, ImageValidationResult };
