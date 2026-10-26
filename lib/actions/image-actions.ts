/**
 * Image Upload and Management Server Actions
 * 
 * This module provides Server Actions for:
 * - Uploading images to Supabase storage (avatars and listings)
 * - Deleting images from Supabase storage
 * - Authentication and authorization checks
 * - Structured error handling for client display
 * - Progress tracking support
 * 
 * Requirements: 13.3, 13.6, 13.7, 13.8, 13.15
 * Task: 6.2 Create image upload Server Actions
 * 
 * @example
 * ```typescript
 * // Upload an image
 * const formData = new FormData();
 * formData.append('file', imageFile);
 * formData.append('listingId', listingId);
 * formData.append('index', '1');
 * 
 * const result = await uploadImageAction(formData, 'listings');
 * if (result.success) {
 *   console.log('Uploaded to:', result.result.url);
 * }
 * 
 * // Delete an image
 * const deleteResult = await deleteImageAction(imagePath, 'listings');
 * ```
 */

'use server';

import { storageService } from '@/lib/services/storage';
import { requireAuth, hasPermission } from '@/lib/services/auth';
import type { ImageUploadActionResult, ActionResult, StorageBucket } from '@/lib/types/core';

// ============================================================================
// Image Upload Server Action
// ============================================================================

/**
 * Upload an image to Supabase storage
 * 
 * This Server Action:
 * 1. Validates user authentication
 * 2. Extracts and validates the image file from FormData
 * 3. Validates file type and size
 * 4. Uploads to the specified storage bucket
 * 5. Returns the public URL and upload metadata
 * 
 * Requirements: 13.3, 13.6, 13.7, 13.8, 13.15
 * 
 * @param formData - FormData containing:
 *   - file: File - The image file to upload
 *   - listingId: string (optional) - Required for listings bucket
 *   - index: string (optional) - Image index for listings (default: 1)
 * @param bucket - Target storage bucket ('avatars' | 'listings')
 * @returns ActionResult with ImageUploadResult on success
 * 
 * @example
 * ```typescript
 * // Client-side component
 * const handleUpload = async (file: File) => {
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   formData.append('listingId', listingId);
 *   formData.append('index', '1');
 *   
 *   const result = await uploadImageAction(formData, 'listings');
 *   
 *   if (result.success && result.result) {
 *     setImageUrl(result.result.url);
 *   } else {
 *     setError(result.error);
 *   }
 * };
 * ```
 */
export async function uploadImageAction(
  formData: FormData,
  bucket: StorageBucket
): Promise<ImageUploadActionResult> {
  try {
    // Requirement 13.6: Check authentication (user must be logged in)
    const user = await requireAuth();

    // Extract file from FormData
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided. Please select an image to upload.',
      };
    }

    // Validate that it's actually a File object
    if (!(file instanceof File)) {
      return {
        success: false,
        error: 'Invalid file data. Please try again.',
      };
    }

    // Extract optional parameters
    const listingId = formData.get('listingId') as string | null;
    const indexStr = formData.get('index') as string | null;
    const index = indexStr ? parseInt(indexStr, 10) : 1;

    // Validate listing ID for listings bucket
    if (bucket === 'listings' && !listingId) {
      return {
        success: false,
        error: 'Listing ID is required for listing images.',
      };
    }

    // Validate image file (type and size)
    const validation = storageService.validateImage(file, bucket);
    
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid image file.',
      };
    }

    // Requirement 13.7: Upload image to storage
    const result = await storageService.uploadImage(
      file,
      bucket,
      user.id,
      listingId || undefined,
      index
    );

    // Return success with upload result
    return {
      success: true,
      result: result,
    };
  } catch (error) {
    // Requirement 13.8: Handle upload errors with structured error messages
    console.error(`Image upload error (${bucket}):`, error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Authentication required')) {
        return {
          success: false,
          error: 'Please log in to upload images.',
        };
      }
      
      if (error.message.includes('permission') || error.message.includes('authorized')) {
        return {
          success: false,
          error: 'You do not have permission to upload to this location.',
        };
      }

      if (error.message.includes('too large') || error.message.includes('Payload too large')) {
        return {
          success: false,
          error: bucket === 'avatars' 
            ? 'Image too large. Maximum size is 2MB for avatars.'
            : 'Image too large. Maximum size is 5MB for listing images.',
        };
      }

      if (error.message.includes('Invalid') || error.message.includes('mime type')) {
        return {
          success: false,
          error: 'Invalid image type. Only JPEG, PNG, and WebP images are allowed.',
        };
      }

      if (error.message.includes('network') || error.message.includes('connection')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }

      // Return the error message if it's already user-friendly
      return {
        success: false,
        error: error.message,
      };
    }

    // Generic error fallback
    return {
      success: false,
      error: 'Failed to upload image. Please try again.',
    };
  }
}

// ============================================================================
// Image Deletion Server Action
// ============================================================================

/**
 * Delete an image from Supabase storage
 * 
 * This Server Action:
 * 1. Validates user authentication
 * 2. Extracts user ID from the image path
 * 3. Validates authorization (user can only delete own images, or admin)
 * 4. Deletes the image from storage
 * 
 * Requirements: 13.6, 13.7, 13.8, 13.10
 * 
 * @param imagePath - Storage path of the image to delete (e.g., 'user-id/listing-id/image-1-123456.webp')
 * @param bucket - Storage bucket containing the image ('avatars' | 'listings')
 * @returns ActionResult indicating success or failure
 * 
 * @example
 * ```typescript
 * // Client-side component
 * const handleDelete = async (imageUrl: string) => {
 *   // Extract path from URL
 *   const path = extractPathFromUrl(imageUrl);
 *   
 *   const result = await deleteImageAction(path, 'listings');
 *   
 *   if (result.success) {
 *     removeImageFromList(imageUrl);
 *   } else {
 *     setError(result.error);
 *   }
 * };
 * ```
 */
export async function deleteImageAction(
  imagePath: string,
  bucket: StorageBucket
): Promise<ActionResult> {
  try {
    // Requirement 13.6: Check authentication (user must be logged in)
    const user = await requireAuth();

    // Validate image path
    if (!imagePath || typeof imagePath !== 'string') {
      return {
        success: false,
        error: 'Invalid image path.',
      };
    }

    // Requirement 13.7: Check authorization (user can only delete own images)
    // Extract user ID from path (format: userId/listingId/filename or userId/filename)
    const pathParts = imagePath.split('/');
    const imageOwnerId = pathParts[0];

    if (!imageOwnerId) {
      return {
        success: false,
        error: 'Invalid image path format.',
      };
    }

    // Check if user owns this image or is an admin
    if (!hasPermission(user, imageOwnerId)) {
      return {
        success: false,
        error: 'You do not have permission to delete this image.',
      };
    }

    // Delete the image from storage
    await storageService.deleteImage(imagePath, bucket);

    // Return success
    return {
      success: true,
    };
  } catch (error) {
    // Requirement 13.8: Handle deletion errors with structured error messages
    console.error(`Image deletion error (${bucket}):`, error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Authentication required')) {
        return {
          success: false,
          error: 'Please log in to delete images.',
        };
      }

      if (error.message.includes('permission') || error.message.includes('authorized')) {
        return {
          success: false,
          error: 'You do not have permission to delete this image.',
        };
      }

      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return {
          success: false,
          error: 'Image not found. It may have already been deleted.',
        };
      }

      if (error.message.includes('network') || error.message.includes('connection')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }

      // Return the error message if it's already user-friendly
      return {
        success: false,
        error: error.message,
      };
    }

    // Generic error fallback
    return {
      success: false,
      error: 'Failed to delete image. Please try again.',
    };
  }
}

// ============================================================================

/**
 * Extract storage path from public image URL
 * 
 * This is a helper function to extract the storage path from a public URL.
 * The path can then be used with deleteImageAction.
 * 
 * @param url - Public image URL
 * @param bucket - Storage bucket
 * @returns Storage path or null if invalid URL
 * 
 * @example
 * ```typescript
 * const url = 'https://project.supabase.co/storage/v1/object/public/listings/user-id/listing-id/image.webp';
 * const path = extractPathFromUrl(url, 'listings');
 * // Returns: 'user-id/listing-id/image.webp'
 * ```
 */
export async function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
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

// ============================================================================
// Batch Upload Support (for future enhancement)
// ============================================================================

/**
 * Upload multiple images in sequence
 * 
 * This function uploads multiple images one by one, providing progress updates.
 * This is useful for the ImageUploader component that handles 3-5 images.
 * 
 * Note: This uploads sequentially rather than in parallel to avoid overwhelming
 * the storage service and to provide accurate progress tracking.
 * 
 * @param files - Array of files to upload
 * @param bucket - Target storage bucket
 * @param listingId - Optional listing ID (required for listings bucket)
 * @param onProgress - Callback for progress updates (called after each upload)
 * @returns Array of upload results (success + result for each file)
 * 
 * @example
 * ```typescript
 * const files = [file1, file2, file3];
 * const results = await uploadMultipleImages(
 *   files,
 *   'listings',
 *   listingId,
 *   (completed, total) => {
 *     console.log(`Uploaded ${completed} of ${total}`);
 *   }
 * );
 * 
 * const successfulUploads = results.filter(r => r.success);
 * const imageUrls = successfulUploads.map(r => r.result!.url);
 * ```
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: StorageBucket,
  listingId?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<ImageUploadActionResult[]> {
  const results: ImageUploadActionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const formData = new FormData();
    formData.append('file', file);
    
    if (listingId) {
      formData.append('listingId', listingId);
    }
    
    formData.append('index', String(i + 1));

    const result = await uploadImageAction(formData, bucket);
    results.push(result);

    // Call progress callback
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    // If upload failed, we might want to stop or continue
    // For now, we continue to upload remaining images
  }

  return results;
}
