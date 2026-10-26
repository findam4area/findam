'use client';

/**
 * A/B Testing React Hooks
 * Task 16.2: Enhanced with gradual rollout support
 * Requirements: 30.3, 30.7
 */

import { useState, useEffect } from 'react';
import { 
  getABTestVariant, 
  trackABTestExposure, 
  ABTestVariant, 
  assignABTestVariant,
  trackFeatureRollout 
} from './feature-flags';

export interface UseABTestOptions {
  rolloutPercentage?: number;
  metadata?: Record<string, any>;
}

/**
 * Hook for A/B testing with automatic exposure tracking and gradual rollout
 * Task 16.2: Enhanced with rollout support
 * Requirements: 30.3
 * 
 * @param testKey - A/B test key
 * @param defaultVariant - Default variant
 * @param options - Optional configuration including rollout percentage
 * @returns The assigned variant
 */
export function useABTest(
  testKey: string,
  defaultVariant: string = 'control',
  options?: UseABTestOptions
): string {
  const [variant, setVariant] = useState<string>(defaultVariant);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get variant from PostHog with rollout support
    const assignedVariant = getABTestVariant(
      testKey, 
      defaultVariant,
      options?.rolloutPercentage
    );
    setVariant(assignedVariant);
    setIsLoading(false);
    
    // Track exposure with metadata
    trackABTestExposure(testKey, assignedVariant, {
      rollout_percentage: options?.rolloutPercentage,
      ...options?.metadata,
    });
  }, [testKey, defaultVariant, options?.rolloutPercentage]);

  return isLoading ? defaultVariant : variant;
}

/**
 * Hook for client-side A/B testing with gradual rollout
 * Task 16.2: Enhanced with rollout support
 * Requirements: 30.3, 30.11 (Property 19: A/B Test Variant Consistency)
 * 
 * @param testKey - A/B test key
 * @param variants - List of variant configurations
 * @param options - Optional configuration including rollout percentage
 * @returns The assigned variant
 */
export function useClientABTest(
  testKey: string,
  variants: ABTestVariant[],
  options?: UseABTestOptions
): string {
  const [variant, setVariant] = useState<string>('');

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const assignedVariant = assignABTestVariant(
      testKey, 
      variants,
      options?.rolloutPercentage
    );
    setVariant(assignedVariant);
    
    // Track exposure with metadata
    trackABTestExposure(testKey, assignedVariant, {
      client_side: true,
      rollout_percentage: options?.rolloutPercentage,
      ...options?.metadata,
    });
  }, [testKey, variants, options?.rolloutPercentage]);

  return variant;
}

/**
 * Hook to check if a feature flag is enabled with gradual rollout
 * Task 16.2: Enhanced with rollout support
 * Requirements: 30.3
 * 
 * @param flagKey - Feature flag key
 * @param defaultValue - Default value if flag is not set
 * @param rolloutPercentage - Optional percentage for gradual rollout (0-100)
 * @returns Whether the flag is enabled
 */
export function useFeatureFlag(
  flagKey: string,
  defaultValue: boolean = false,
  rolloutPercentage?: number
): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(defaultValue);

  useEffect(() => {
    // Import here to avoid SSR issues
    import('./feature-flags').then(({ isFeatureEnabled, trackFeatureRollout }) => {
      const enabled = isFeatureEnabled(flagKey, defaultValue, rolloutPercentage);
      setIsEnabled(enabled);
      
      // Track rollout exposure if percentage is specified
      if (rolloutPercentage !== undefined) {
        trackFeatureRollout(flagKey, enabled, rolloutPercentage);
      }
    });
  }, [flagKey, defaultValue, rolloutPercentage]);

  return isEnabled;
}
