/**
 * GDPR Cookie Consent Management
 * Requirements: 18.9, 30.10, 31.6, 31.7, 31.8
 */

export interface CookieConsentPreferences {
  necessary: boolean; // Always true, required for basic functionality
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const CONSENT_COOKIE_NAME = 'findam_cookie_consent';
const CONSENT_COOKIE_EXPIRY_DAYS = 365;

/**
 * Get user's cookie consent preferences
 * Requirements: 31.6
 * 
 * @returns Cookie consent preferences or null if not set
 */
export function getCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
    ?.split('=')[1];

  if (!cookieValue) return null;

  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return null;
  }
}

/**
 * Set user's cookie consent preferences
 * Requirements: 31.6
 * 
 * @param preferences - Cookie consent preferences
 */
export function setCookieConsent(preferences: CookieConsentPreferences): void {
  if (typeof window === 'undefined') return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + CONSENT_COOKIE_EXPIRY_DAYS);

  const cookieValue = encodeURIComponent(JSON.stringify(preferences));
  document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict; Secure`;

  // Apply preferences immediately
  applyConsentPreferences(preferences);
  
  // Dispatch event for other components to listen
  window.dispatchEvent(
    new CustomEvent('cookieConsentChanged', { detail: preferences })
  );
}

/**
 * Clear cookie consent preferences
 * Requirements: 31.8
 */
export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return;

  document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Check if specific cookie category is consented
 * Requirements: 31.6
 * 
 * @param category - Cookie category
 * @returns Whether the category is consented
 */
export function hasConsentFor(
  category: keyof CookieConsentPreferences
): boolean {
  const consent = getCookieConsent();
  
  // If no consent given, only necessary cookies are allowed
  if (!consent) {
    return category === 'necessary';
  }

  return consent[category];
}

/**
 * Apply consent preferences to analytics and tracking scripts
 * Requirements: 31.6, 31.7
 * 
 * @param preferences - Cookie consent preferences
 */
function applyConsentPreferences(preferences: CookieConsentPreferences): void {
  if (typeof window === 'undefined') return;

  // PostHog opt-in/opt-out
  if (preferences.analytics) {
    // Enable PostHog
    if (window.posthog) {
      window.posthog.opt_in_capturing();
    }
  } else {
    // Disable PostHog
    if (window.posthog) {
      window.posthog.opt_out_capturing();
    }
  }

  // You can add more analytics services here
  // Example: Google Analytics, Facebook Pixel, etc.
}

/**
 * Check if user is in EU (for GDPR compliance)
 * This is a simplified check - in production, use a proper geolocation service
 * Requirements: 31.6
 * 
 * @returns Whether user is likely in EU
 */
export function isLikelyEUUser(): boolean {
  if (typeof window === 'undefined') return false;

  // Check timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const euTimezones = [
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Vienna',
    'Europe/Stockholm',
    'Europe/Copenhagen',
    'Europe/Helsinki',
    'Europe/Dublin',
    'Europe/Lisbon',
    'Europe/Athens',
    'Europe/Warsaw',
    'Europe/Prague',
    'Europe/Budapest',
    'Europe/Bucharest',
  ];

  return euTimezones.includes(timezone);
}

// Type augmentation for window object
declare global {
  interface Window {
    posthog?: {
      opt_in_capturing: () => void;
      opt_out_capturing: () => void;
    };
  }
}
