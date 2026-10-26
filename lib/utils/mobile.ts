/**
 * Mobile Responsiveness Utilities
 * 
 * Helper functions and constants for mobile-first responsive design
 * 
 * Requirements: 11.2, 11.3, 11.4, 11.6, 11.7, 11.8
 * Task: 10.1
 */

/**
 * Responsive breakpoints (px)
 * Mobile-first approach: define min-width breakpoints
 */
export const BREAKPOINTS = {
  xs: 320,  // Minimum mobile width (iPhone SE)
  sm: 640,  // Small devices (landscape phones)
  md: 768,  // Tablet breakpoint
  lg: 1024, // Desktop breakpoint
  xl: 1440, // Extra large devices
  '2xl': 1920, // 2K screens
  '3xl': 2560, // Maximum supported width
} as const;

/**
 * WCAG 2.1 minimum touch target size (px)
 * All interactive elements should meet this minimum
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Minimum font size to prevent iOS zoom (px)
 * iOS Safari zooms in when input font size is below 16px
 */
export const MIN_BODY_TEXT_SIZE = 16;

/**
 * WCAG AA minimum contrast ratio
 */
export const MIN_CONTRAST_RATIO = 4.5;

/**
 * Tailwind responsive sizes string for Next.js Image component
 * Use for listing cards, featured items, etc.
 */
export const RESPONSIVE_IMAGE_SIZES = {
  // Full width on mobile, 50% on tablet, 33% on desktop
  card: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  
  // Full width on mobile, 100% on all sizes
  hero: '100vw',
  
  // Thumbnail sizes
  thumbnail: '(max-width: 768px) 25vw, 200px',
  
  // Avatar sizes
  avatar: '(max-width: 768px) 48px, 64px',
  
  // Gallery images
  gallery: '(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw',
} as const;

/**
 * Check if viewport width is mobile
 * @param width - Viewport width in pixels
 * @returns True if mobile viewport
 */
export function isMobileViewport(width: number): boolean {
  return width < BREAKPOINTS.md;
}

/**
 * Check if viewport width is tablet
 * @param width - Viewport width in pixels
 * @returns True if tablet viewport
 */
export function isTabletViewport(width: number): boolean {
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
}

/**
 * Check if viewport width is desktop
 * @param width - Viewport width in pixels
 * @returns True if desktop viewport
 */
export function isDesktopViewport(width: number): boolean {
  return width >= BREAKPOINTS.lg;
}

/**
 * Get current breakpoint name based on viewport width
 * @param width - Viewport width in pixels
 * @returns Breakpoint name
 */
export function getCurrentBreakpoint(
  width: number
): keyof typeof BREAKPOINTS {
  if (width >= BREAKPOINTS['3xl']) return '3xl';
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Validate touch target size meets WCAG requirements
 * @param width - Element width in pixels
 * @param height - Element height in pixels
 * @returns True if meets minimum size
 */
export function isValidTouchTarget(width: number, height: number): boolean {
  return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Get grid column count based on viewport width
 * @param width - Viewport width in pixels
 * @param options - Configuration for column counts at different breakpoints
 * @returns Number of columns
 */
export function getGridColumns(
  width: number,
  options: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  } = {}
): number {
  const defaults = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 };
  const config = { ...defaults, ...options };

  if (width >= BREAKPOINTS.xl) return config.xl!;
  if (width >= BREAKPOINTS.lg) return config.lg!;
  if (width >= BREAKPOINTS.md) return config.md!;
  if (width >= BREAKPOINTS.sm) return config.sm!;
  return config.xs!;
}

/**
 * Get appropriate input type for mobile keyboards
 * @param fieldType - Type of field (email, phone, etc.)
 * @returns HTML input type
 */
export function getMobileInputType(
  fieldType: 'email' | 'phone' | 'number' | 'url' | 'text'
): string {
  const typeMap = {
    email: 'email',
    phone: 'tel',
    number: 'number',
    url: 'url',
    text: 'text',
  };

  return typeMap[fieldType];
}

/**
 * Format phone number for tel: link
 * @param phone - Phone number string
 * @returns Formatted phone number for href
 */
export function formatPhoneHref(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  return `tel:+${digits}`;
}

/**
 * Check if device supports touch
 * Note: This is a client-side only check
 * @returns True if touch is supported
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Legacy property
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get safe area inset for iOS devices with notch
 * @returns CSS variable string
 */
export function getSafeAreaInset(position: 'top' | 'bottom' | 'left' | 'right'): string {
  return `env(safe-area-inset-${position}, 0px)`;
}

/**
 * Tailwind class names for mobile-optimized spacing
 */
export const MOBILE_SPACING = {
  container: 'px-4 sm:px-6 lg:px-8',
  section: 'py-8 md:py-12 lg:py-16',
  card: 'p-4 sm:p-6',
  gap: 'gap-4 md:gap-6',
} as const;

/**
 * Tailwind class names for responsive typography
 */
export const RESPONSIVE_TEXT = {
  heading1: 'text-3xl md:text-4xl lg:text-5xl',
  heading2: 'text-2xl md:text-3xl lg:text-4xl',
  heading3: 'text-xl md:text-2xl lg:text-3xl',
  heading4: 'text-lg md:text-xl lg:text-2xl',
  body: 'text-base md:text-lg',
  small: 'text-sm md:text-base',
} as const;

/**
 * Animation durations for smooth mobile interactions (ms)
 */
export const ANIMATION_DURATION = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

/**
 * Check if prefers-reduced-motion is enabled
 * @returns True if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get appropriate animation class based on user preferences
 * @param animationClass - Animation class to apply
 * @returns Animation class or empty string if reduced motion
 */
export function getAnimationClass(animationClass: string): string {
  return prefersReducedMotion() ? '' : animationClass;
}
