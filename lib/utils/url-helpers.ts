/**
 * URL Helper Utilities
 * 
 * Provides safe URL construction and validation helpers
 * to prevent "Invalid URL" errors throughout the application
 */

/**
 * Safely construct a URL with error handling
 * 
 * @param url - URL string or URL parts
 * @param base - Optional base URL
 * @returns URL object or null if invalid
 */
export function safeURL(url: string, base?: string): URL | null {
  try {
    // Handle empty or whitespace-only strings
    if (!url || url.trim() === '') {
      return null;
    }
    
    return new URL(url, base);
  } catch (error) {
    console.error('Invalid URL construction:', { url, base, error });
    return null;
  }
}

/**
 * Get the application base URL with fallback
 * 
 * @returns Valid application URL
 */
export function getAppBaseURL(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // Check if URL is valid and not empty
  if (envUrl && envUrl.trim() !== '') {
    try {
      new URL(envUrl);
      return envUrl;
    } catch {
      console.warn('Invalid NEXT_PUBLIC_APP_URL, using fallback');
    }
  }
  
  // Fallback to default
  return 'https://findam.ng';
}

/**
 * Safely parse URL search params
 * 
 * @param url - URL string or Request URL
 * @returns URLSearchParams or empty params if invalid
 */
export function safeSearchParams(url: string | Request): URLSearchParams {
  try {
    const urlString = typeof url === 'string' ? url : url.url;
    const urlObj = new URL(urlString);
    return urlObj.searchParams;
  } catch (error) {
    console.error('Invalid URL for search params:', url, error);
    return new URLSearchParams();
  }
}

/**
 * Validate if a string is a valid URL
 * 
 * @param url - URL string to validate
 * @returns True if valid URL
 */
export function isValidURL(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get URL origin safely
 * 
 * @param url - URL string
 * @returns Origin or empty string if invalid
 */
export function getURLOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}
