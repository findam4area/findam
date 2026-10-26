/**
 * Image Optimization Utilities
 * Utilities for image size generation, validation, and filename generation
 * Requirements: 13.14, 13.15
 */

/**
 * Image size constants for different contexts
 */
export const IMAGE_SIZES = {
  thumbnail: 200,
  card: 400,
  detail: 800,
  fullscreen: 1920,
} as const;

/**
 * Image quality constants for different contexts
 */
export const IMAGE_QUALITY = {
  thumbnail: 75,
  card: 80,
  detail: 85,
  fullscreen: 90,
} as const;

/**
 * Image context types
 */
export type ImageContext = 'thumbnail' | 'card' | 'detail' | 'fullscreen';

/**
 * Storage bucket types
 */
export type StorageBucket = 'avatars' | 'listings';

/**
 * Image validation result
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Get responsive image sizes string for Next.js Image component
 * Returns sizes attribute based on the image context
 * 
 * Requirements: 13.14, 13.15
 * 
 * @param context - The context where the image will be displayed
 * @returns Sizes string for Next.js Image component
 * 
 * @example
 * ```tsx
 * <Image
 *   src={imageSrc}
 *   alt={alt}
 *   sizes={getImageSizes('card')}
 *   fill
 * />
 * ```
 */
export function getImageSizes(context: ImageContext): string {
  switch (context) {
    case 'thumbnail':
      // Small images in grids or lists
      return '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px';
    
    case 'card':
      // Medium images in card layouts
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px';
    
    case 'detail':
      // Large images on detail pages
      return '(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 800px';
    
    case 'fullscreen':
      // Full-screen images in galleries
      return '100vw';
    
    default:
      // Default fallback
      return '100vw';
  }
}

/**
 * Validate image file before upload
 * Checks file type and size based on bucket configuration
 * 
 * Requirements: 13.14, 13.15
 * 
 * @param file - The file to validate
 * @param bucket - The storage bucket where file will be uploaded
 * @returns Validation result with error message if invalid
 * 
 * @example
 * ```ts
 * const validation = validateImageFile(file, 'listings');
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 * ```
 */
export function validateImageFile(
  file: File,
  bucket: StorageBucket
): ImageValidationResult {
  // Define allowed MIME types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  // Define max file sizes per bucket (in bytes)
  const maxSizes = {
    avatars: 2 * 1024 * 1024,  // 2MB for avatars
    listings: 5 * 1024 * 1024,  // 5MB for listings
  };

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Only JPEG, PNG, and WebP formats are allowed. Received: ${file.type}`,
    };
  }

  // Validate file size
  const maxSize = maxSizes[bucket];
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB for ${bucket}`,
    };
  }

  // Validate that file has content
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

/**
 * Generate unique image filename with timestamp
 * Creates a structured filename with user ID, prefix, and timestamp
 * 
 * Requirements: 13.14, 13.15
 * 
 * @param userId - The user ID uploading the image
 * @param prefix - Optional prefix for the filename (e.g., 'avatar', 'listing')
 * @returns Unique filename string
 * 
 * @example
 * ```ts
 * const filename = generateImageFilename('user-123', 'avatar');
 * // Returns: 'user-123/avatar-1234567890123.webp'
 * 
 * const filename = generateImageFilename('user-456', 'listing-789');
 * // Returns: 'user-456/listing-789-1234567890123.webp'
 * ```
 */
export function generateImageFilename(
  userId: string,
  prefix?: string
): string {
  // Generate timestamp for uniqueness
  const timestamp = Date.now();
  
  // Generate random suffix for additional uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  // Construct filename parts
  const baseName = prefix ? `${prefix}-${timestamp}-${randomSuffix}` : `image-${timestamp}-${randomSuffix}`;
  
  // Use .webp as default extension for optimized storage
  const filename = `${baseName}.webp`;
  
  // Include user ID in path for organization
  return `${userId}/${filename}`;
}

/**
 * Get image optimization parameters for Next.js Image component
 * Returns quality setting based on context
 * 
 * Requirements: 13.14, 13.15
 * 
 * @param context - The context where the image will be displayed
 * @returns Quality value for Next.js Image component
 */
export function getImageQuality(context: ImageContext): number {
  return IMAGE_QUALITY[context];
}

/**
 * Check if file is a valid image type
 * Quick check for image MIME type
 * 
 * @param file - The file to check
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Format file size to human-readable string
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Extract file extension from filename
 * 
 * @param filename - The filename
 * @returns File extension without the dot (e.g., 'jpg', 'png')
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get image dimensions from file
 * Returns a promise that resolves with width and height
 * 
 * @param file - The image file
 * @returns Promise resolving to dimensions object
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Check if image exceeds maximum dimensions
 * 
 * @param width - Image width
 * @param height - Image height
 * @param maxWidth - Maximum allowed width
 * @param maxHeight - Maximum allowed height
 * @returns True if image exceeds maximum dimensions
 */
export function exceedsMaxDimensions(
  width: number,
  height: number,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): boolean {
  return width > maxWidth || height > maxHeight;
}
