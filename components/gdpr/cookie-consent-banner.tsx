'use client';

/**
 * GDPR Cookie Consent Banner
 * Requirements: 18.9, 30.10, 31.6, 31.7, 31.8
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getCookieConsent,
  setCookieConsent,
  CookieConsentPreferences,
} from '@/lib/gdpr/cookie-consent';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const consent = getCookieConsent();
    if (!consent) {
      // Delay showing banner to avoid CLS
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsent: CookieConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    
    setCookieConsent(allConsent);
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    setCookieConsent(preferences);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const minimalConsent: CookieConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    
    setCookieConsent(minimalConsent);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2
                id="cookie-consent-title"
                className="text-lg font-semibold mb-2"
              >
                We value your privacy
              </h2>
              <p
                id="cookie-consent-description"
                className="text-sm text-muted-foreground mb-4"
              >
                We use cookies to enhance your browsing experience, analyze site
                traffic, and personalize content. By clicking "Accept All", you
                consent to our use of cookies.
              </p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Dismiss cookie banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showDetails && (
            <div className="space-y-3 pb-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Necessary Cookies</p>
                  <p className="text-xs text-muted-foreground">
                    Required for basic site functionality
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="h-4 w-4"
                  aria-label="Necessary cookies (required)"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Analytics Cookies</p>
                  <p className="text-xs text-muted-foreground">
                    Help us improve by tracking site usage
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analytics: e.target.checked })
                  }
                  className="h-4 w-4"
                  aria-label="Analytics cookies"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Marketing Cookies</p>
                  <p className="text-xs text-muted-foreground">
                    Used for personalized advertising
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({ ...preferences, marketing: e.target.checked })
                  }
                  className="h-4 w-4"
                  aria-label="Marketing cookies"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Functional Cookies</p>
                  <p className="text-xs text-muted-foreground">
                    Enable enhanced functionality and personalization
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) =>
                    setPreferences({ ...preferences, functional: e.target.checked })
                  }
                  className="h-4 w-4"
                  aria-label="Functional cookies"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={handleAcceptAll} size="sm">
              Accept All
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
              size="sm"
            >
              Reject All
            </Button>
            {showDetails ? (
              <Button
                onClick={handleAcceptSelected}
                variant="secondary"
                size="sm"
              >
                Save Preferences
              </Button>
            ) : (
              <Button
                onClick={() => setShowDetails(true)}
                variant="ghost"
                size="sm"
              >
                Customize
              </Button>
            )}
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground underline ml-auto"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
