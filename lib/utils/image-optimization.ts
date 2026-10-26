/**
 * Image Optimization Utilities
 * 
 * Provides helper functions and constants for Next.js Image optimization
 * 
 * Task: 10.2 - Optimize images with Next.js 16 Image component
 * Requirements: 11.4, 11.5, 13.14, 13.15, 26.4, 26.7, 26.8, 26.11
 */

/**
 * Maximum file size for uploaded images (5MB)
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Accepted image formats for upload
 */
export const ACCEPTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Image size configurations for auto-generation (array format for tests)
 * Requirements: 26.4
 */
export const IMAGE_SIZES = [
  { name: 'thumbnail', width: 256, quality: 75 },
  { name: 'medium', width: 800, quality: 80 },
  { name: 'large', width: 1200, quality: 85 },
] as const;

/**
 * Image size configurations for responsive loading (object format)
 */
export const IMAGE_SIZE_PRESETS = {
  thumbnail: 96,
  small: 256,
  card: 400,
  medium: 800,
  large: 1200,
  fullscreen: 1920,
} as const;

/**
 * Image quality settings for different contexts
 */
export const IMAGE_QUALITY = {
  thumbnail: 75,
  card: 80,
  detail: 85,
  fullscreen: 90,
} as const;

/**
 * Responsive sizes attribute patterns
 * Use these with Next.js Image component for optimal loading
 */
export const RESPONSIVE_SIZES = {
  // Full width on mobile, 50% on tablet, 33% on desktop
  card: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  
  // Featured/hero images that span full width
  hero: '100vw',
  
  // Gallery main image
  gallery: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw',
  
  // Thumbnail grid items
  thumbnail: '(max-width: 640px) 15vw, 10vw',
  
  // Small thumbnails (e.g., in lightbox strip)
  thumbnailSmall: '64px',
  
  // Avatar images
  avatar: '(max-width: 768px) 96px, 128px',
  
  // Category cards
  category: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  
  // Full screen modal/lightbox
  lightbox: '100vw',
} as const;

/**
 * SVG blur placeholder for images
 * Provides a neutral gray placeholder while images load
 */
export const BLUR_DATA_URL = {
  // Standard 4:3 aspect ratio
  standard: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg==',
  
  // Wide 16:9 aspect ratio
  wide: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg==',
  
  // Square 1:1 aspect ratio
  square: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg==',
  
  // Ultra wide for hero images
  ultraWide: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=',
} as const;

/**
 * Get optimized image props for Next.js Image component
 * 
 * @param context - The context where the image is used (card, hero, gallery, etc.)
 * @param options - Additional options
 * @returns Props object to spread on Image component
 */
export function getOptimizedImageProps(
  context: keyof typeof RESPONSIVE_SIZES,
  options: {
    priority?: boolean;
    aspectRatio?: keyof typeof BLUR_DATA_URL;
    quality?: keyof typeof IMAGE_QUALITY;
  } = {}
) {
  const {
    priority = false,
    aspectRatio = 'standard',
    quality = 'card',
  } = options;

  return {
    sizes: RESPONSIVE_SIZES[context],
    priority,
    placeholder: 'blur' as const,
    blurDataURL: BLUR_DATA_URL[aspectRatio],
    quality: IMAGE_QUALITY[quality],
  };
}

/**
 * Check if an image should be prioritized for loading
 * Useful for above-the-fold images
 * 
 * @param index - The index of the image in a list
 * @param threshold - Number of images to prioritize (default: 3)
 * @returns Whether this image should have priority loading
 */
export function shouldPrioritize(index: number, threshold: number = 3): boolean {
  return index < threshold;
}

/**
 * Generate srcset for responsive images
 * Useful for custom image implementations
 * 
 * @param baseUrl - Base URL of the image
 * @param widths - Array of widths to generate
 * @returns srcset string
 */
export function generateSrcSet(baseUrl: string, widths: number[]): string {
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Validate image URL for security and format
 * 
 * @param url - Image URL to validate
 * @returns Whether the URL is valid and safe
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Check for common image extensions
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];
    const hasValidExtension = validExtensions.some(ext => 
      parsed.pathname.toLowerCase().endsWith(ext)
    );
    
    // Also allow URLs without explicit extensions (e.g., Supabase storage URLs)
    return hasValidExtension || parsed.hostname.includes('supabase.co');
  } catch {
    return false;
  }
}

/**
 * Get image dimensions from aspect ratio
 * 
 * @param aspectRatio - Aspect ratio string (e.g., "16:9", "4:3")
 * @param baseWidth - Base width to calculate from
 * @returns Width and height dimensions
 */
export function getDimensionsFromAspectRatio(
  aspectRatio: string,
  baseWidth: number = 400
): { width: number; height: number } {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  const height = Math.round((baseWidth * heightRatio) / widthRatio);
  
  return { width: baseWidth, height };
}

/**
 * Validate image file for upload
 * Requirements: 26.8
 * 
 * @param file - File to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateImage(file: File): { isValid: boolean; error?: string } {
  // Check file format
  if (!ACCEPTED_IMAGE_FORMATS.includes(file.type as any)) {
    return {
      isValid: false,
      error: `Invalid format: ${file.type}. Accepted formats: ${ACCEPTED_IMAGE_FORMATS.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File exceeds maximum allowed size of 5MB (actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate total upload progress across multiple files
 * Requirements: 26.7
 * 
 * @param totalFiles - Total number of files to upload
 * @param completedFiles - Number of files completed
 * @param currentProgress - Progress of current file (0-100)
 * @returns Total progress percentage (0-100)
 */
export function calculateTotalProgress(
  totalFiles: number,
  completedFiles: number,
  currentProgress: number
): number {
  if (totalFiles === 0) return 0;
  
  const completedPercentage = (completedFiles / totalFiles) * 100;
  const currentFilePercentage = (currentProgress / totalFiles);
  const total = completedPercentage + currentFilePercentage;
  
  return Math.min(Math.round(total), 100);
}

/**
 * Get progress message for upload
 * Requirements: 26.7
 * 
 * @param currentFile - Current file number (1-indexed)
 * @param totalFiles - Total number of files
 * @param step - Current step description
 * @returns Formatted progress message
 */
export function getProgressMessage(
  currentFile: number,
  totalFiles: number,
  step: string
): string {
  if (totalFiles === 1) {
    return step;
  }
  
  return `Image ${currentFile}/${totalFiles}: ${step}`;
}

/**
 * Cleanup object URLs to free memory
 * 
 * @param urls - Array of blob URLs to revoke
 */
export function cleanupObjectUrls(urls: string[]): void {
  urls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      // Silently continue if revocation fails
      console.warn('Failed to revoke object URL:', url, error);
    }
  });
}

/**
 * Check if browser supports WebP format
 * 
 * @returns Promise that resolves to true if WebP is supported
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      // Node/test environment
      resolve(false);
      return;
    }

    const webP = new Image();
    webP.onload = webP.onerror = function () {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}
