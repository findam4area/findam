/**
 * Image URL Validation and Sanitization Utilities
 * 
 * Provides functions to validate and sanitize image URLs before passing to next/image
 */

/**
 * Check if a URL is valid for use with next/image
 * @param url - URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidImageUrl(url: unknown): url is string {
  // Check if url exists and is a string
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check if it's a valid HTTP/HTTPS URL
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return false;
  }

  // Check if it's not a common placeholder/icon name
  const invalidNames = ['home', 'icon', 'logo', 'placeholder', 'avatar'];
  const lowerUrl = url.toLowerCase();
  if (invalidNames.some(name => lowerUrl === name)) {
    return false;
  }

  // Try to construct URL to validate format
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a safe image URL with fallback
 * @param url - Original URL
 * @param fallback - Fallback URL or generate from title
 * @param title - Title for generating fallback
 * @returns Valid image URL
 */
export function getSafeImageUrl(
  url: unknown,
  fallback?: string,
  title?: string
): string {
  // If valid URL, use it
  if (isValidImageUrl(url)) {
    return url;
  }

  // Use provided fallback
  if (fallback && isValidImageUrl(fallback)) {
    return fallback;
  }

  // Generate fallback from title
  if (title) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&size=400&background=random&color=fff`;
  }

  // Default fallback
  return 'https://ui-avatars.com/api/?name=No+Image&size=400&background=cccccc&color=333';
}

/**
 * Validate and sanitize an array of image URLs
 * @param urls - Array of URLs to validate
 * @returns Array of valid URLs only
 */
export function sanitizeImageUrls(urls: unknown[]): string[] {
  if (!Array.isArray(urls)) {
    return [];
  }

  return urls.filter((url): url is string => isValidImageUrl(url));
}
