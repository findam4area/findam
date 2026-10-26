'use client';

/**
 * PostHog Analytics Provider
 * Initializes PostHog for user behavior tracking and A/B testing
 * Requirements: 18.2, 18.3, 18.4, 30.2, 30.6
 */

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { ANALYTICS_CONFIG } from './config';

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views on route change
  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog only if enabled and API key is present
    if (ANALYTICS_CONFIG.posthog.enabled && ANALYTICS_CONFIG.posthog.apiKey) {
      posthog.init(ANALYTICS_CONFIG.posthog.apiKey, {
        api_host: ANALYTICS_CONFIG.posthog.apiHost,
        
        // Autocapture configuration
        autocapture: ANALYTICS_CONFIG.posthog.autocapture.enabled,
        capture_pageview: ANALYTICS_CONFIG.posthog.autocapture.capturePageview,
        capture_pageleave: ANALYTICS_CONFIG.posthog.autocapture.capturePageleave,
        
        // Session recording
        disable_session_recording: !ANALYTICS_CONFIG.posthog.enableSessionRecording,
        
        // Privacy settings
        respect_dnt: ANALYTICS_CONFIG.posthog.respectDNT,
        mask_all_text: ANALYTICS_CONFIG.posthog.maskAllText,
        mask_all_element_attributes: ANALYTICS_CONFIG.posthog.maskAllInputs,
        
        // Performance
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('PostHog initialized');
          }
        },
      });
    }

    return () => {
      // Cleanup on unmount
      if (posthog.__loaded) {
        posthog.reset();
      }
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
