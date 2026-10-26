/**
 * Accessibility Utilities
 * 
 * Helper functions for implementing accessibility features
 * Requirements: 9.6, 10.4, 11.9
 */

/**
 * Generates descriptive alt text for listing images
 * 
 * @param listingTitle - The title of the listing
 * @param imageIndex - Index of the image (0-based)
 * @param totalImages - Total number of images
 * @param isDecorative - If true, returns empty string for decorative images
 */
export function generateListingImageAlt(
  listingTitle: string,
  imageIndex: number = 0,
  totalImages: number = 1,
  isDecorative: boolean = false
): string {
  if (isDecorative) return '';
  
  if (totalImages === 1) {
    return `Image of ${listingTitle}`;
  }
  
  return `Image ${imageIndex + 1} of ${totalImages} for ${listingTitle}`;
}

/**
 * Generates alt text for user avatars
 * 
 * @param userName - The user's name
 * @param isDecorative - If true, returns empty string
 */
export function generateAvatarAlt(
  userName: string,
  isDecorative: boolean = false
): string {
  if (isDecorative) return '';
  return `${userName}'s profile picture`;
}

/**
 * Generates alt text for category images
 * 
 * @param categoryName - The category name
 * @param isDecorative - If true, returns empty string
 */
export function generateCategoryImageAlt(
  categoryName: string,
  isDecorative: boolean = false
): string {
  if (isDecorative) return '';
  return `${categoryName} category`;
}

/**
 * Generates ARIA label for buttons with icon only
 * 
 * @param action - The action the button performs
 * @param context - Additional context (e.g., item name)
 */
export function generateIconButtonLabel(
  action: string,
  context?: string
): string {
  return context ? `${action} ${context}` : action;
}

/**
 * Checks if color contrast meets WCAG AA standards
 * 
 * @param foreground - Foreground color (hex or rgb)
 * @param background - Background color (hex or rgb)
 * @param isLargeText - If true, uses 3:1 ratio, otherwise 4.5:1
 * @returns boolean indicating if contrast is sufficient
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const luminance = (color: string): number => {
    // Convert hex to RGB
    let rgb: number[];
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      rgb = [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16),
      ];
    } else {
      // Parse rgb() or rgba()
      const match = color.match(/\d+/g);
      if (!match) return 0;
      rgb = match.slice(0, 3).map(Number);
    }

    // Calculate relative luminance
    const [r, g, b] = rgb.map((val) => {
      const sRGB = val / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Generates an announcement message for screen readers
 * 
 * @param action - The action that occurred
 * @param result - The result of the action
 * @param count - Optional count for plural items
 */
export function generateAnnouncementMessage(
  action: 'added' | 'removed' | 'updated' | 'loaded' | 'error',
  result: string,
  count?: number
): string {
  const countText = count !== undefined ? `${count} ` : '';
  
  const messages = {
    added: `${result} added successfully`,
    removed: `${result} removed successfully`,
    updated: `${result} updated successfully`,
    loaded: `${countText}${result} loaded`,
    error: `Error: ${result}`,
  };

  return messages[action];
}

/**
 * Generates ARIA label for pagination buttons
 * 
 * @param page - Page number
 * @param total - Total pages
 * @param isCurrent - If this is the current page
 */
export function generatePaginationLabel(
  page: number,
  total: number,
  isCurrent: boolean = false
): string {
  if (isCurrent) {
    return `Current page, page ${page} of ${total}`;
  }
  return `Go to page ${page} of ${total}`;
}

/**
 * Generates ARIA label for sort/filter controls
 * 
 * @param type - Type of control ('sort' | 'filter')
 * @param value - Current value
 * @param optionsCount - Number of available options
 */
export function generateFilterLabel(
  type: 'sort' | 'filter',
  value: string,
  optionsCount: number
): string {
  return `${type === 'sort' ? 'Sort' : 'Filter'} by ${value}, ${optionsCount} options available`;
}

/**
 * Generates ARIA label for like/save buttons
 * 
 * @param action - The action ('like' | 'save' | 'share')
 * @param isActive - Current state
 * @param itemName - Name of the item
 */
export function generateActionButtonLabel(
  action: 'like' | 'save' | 'share' | 'report',
  isActive: boolean,
  itemName?: string
): string {
  const item = itemName ? ` ${itemName}` : '';
  
  const labels = {
    like: isActive ? `Unlike${item}` : `Like${item}`,
    save: isActive ? `Unsave${item}` : `Save${item}`,
    share: `Share${item}`,
    report: `Report${item}`,
  };

  return labels[action];
}

/**
 * Generates ARIA label for file upload inputs
 * 
 * @param fileType - Type of file (e.g., 'image', 'video', 'document')
 * @param multiple - Whether multiple files can be selected
 * @param maxFiles - Maximum number of files allowed
 */
export function generateFileUploadLabel(
  fileType: string,
  multiple: boolean = false,
  maxFiles?: number
): string {
  const pluralType = multiple ? `${fileType}s` : fileType;
  const maxText = maxFiles ? `, maximum ${maxFiles}` : '';
  return `Upload ${pluralType}${maxText}`;
}

/**
 * Announces route changes to screen readers
 * 
 * @param route - The new route/page name
 */
export function announceRouteChange(route: string): string {
  return `Navigated to ${route}`;
}

/**
 * Generates ARIA label for search inputs
 * 
 * @param context - Context of the search (e.g., 'listings', 'messages')
 */
export function generateSearchLabel(context: string = 'site'): string {
  return `Search ${context}`;
}

/**
 * Generates ARIA label for notification badges
 * 
 * @param count - Number of unread notifications
 * @param type - Type of notifications
 */
export function generateNotificationLabel(
  count: number,
  type: string = 'notifications'
): string {
  if (count === 0) {
    return `No unread ${type}`;
  }
  return count === 1
    ? `1 unread ${type.replace(/s$/, '')}`
    : `${count} unread ${type}`;
}

/**
 * Generates ARIA label for progress indicators
 * 
 * @param current - Current step/progress
 * @param total - Total steps/100 for percentage
 * @param label - Description of what's progressing
 */
export function generateProgressLabel(
  current: number,
  total: number,
  label: string = 'progress'
): string {
  const percentage = Math.round((current / total) * 100);
  return `${label}: ${percentage}% complete, ${current} of ${total}`;
}

/**
 * Validates that interactive elements meet minimum touch target size
 * 
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @returns boolean indicating if size meets WCAG guidelines (44x44px minimum)
 */
export function validateTouchTargetSize(
  width: number,
  height: number
): boolean {
  const MIN_SIZE = 44; // WCAG 2.1 AA minimum
  return width >= MIN_SIZE && height >= MIN_SIZE;
}

/**
 * Generates keyboard shortcut hint for ARIA label
 * 
 * @param action - The action
 * @param keys - Keyboard shortcut keys
 */
export function generateKeyboardShortcutLabel(
  action: string,
  keys: string
): string {
  return `${action}, keyboard shortcut: ${keys}`;
}

/**
 * Formats numbers for screen readers
 * 
 * @param num - Number to format
 */
export function formatNumberForScreenReader(num: number): string {
  return num.toLocaleString();
}

/**
 * Formats price for screen readers
 * 
 * @param price - Price in naira
 */
export function formatPriceForScreenReader(price: number): string {
  return `${price.toLocaleString()} naira`;
}

/**
 * Formats rating for screen readers
 * 
 * @param rating - Rating value (0-5)
 * @param maxRating - Maximum rating value (default 5)
 */
export function formatRatingForScreenReader(rating: number, maxRating: number = 5): string {
  return `Rated ${rating} out of ${maxRating} stars`;
}

/**
 * Formats time remaining for screen readers
 * 
 * @param seconds - Time remaining in seconds
 */
export function formatTimeRemainingForScreenReader(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  
  return parts.join(', ') + ' remaining';
}

/**
 * Alias for generateListingImageAlt for backward compatibility
 */
export function generateListingAltText(
  listingTitle: string,
  imageIndex: number = 0,
  totalImages: number = 1
): string {
  return generateListingImageAlt(listingTitle, imageIndex, totalImages, false);
}

/**
 * Alias for generateSearchLabel for backward compatibility
 */
export function generateAriaLabel(context: string): string {
  return generateSearchLabel(context);
}

/**
 * Brand colors for contrast checking
 */
export const BRAND_COLORS = {
  primary: '#00ff41',
  secondary: '#1a1a1a',
  background: '#0a0a0a',
  text: '#ffffff',
  textMuted: '#9ca3af',
};
