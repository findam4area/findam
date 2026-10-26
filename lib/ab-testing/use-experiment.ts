'use client';

/**
 * A/B Testing React Hook
 * Provides easy access to experiment variants in components
 * Requirements: 18.6, 30.3, 30.11
 */

import { useEffect, useState } from 'react';
import { getVariant, isFeatureEnabled, getSessionId } from './variant-assignment';
import { trackEvent } from '../analytics';

/**
 * Hook to get the assigned variant for an experiment
 * Requirements: 30.11 - Consistent variant assignment
 * 
 * @param experimentId - The experiment identifier
 * @param userId - Optional user ID (uses session ID if not provided)
 * @returns The assigned variant name
 */
export function useExperiment(experimentId: string, userId?: string): string {
  const [variant, setVariant] = useState<string>('control');
  
  useEffect(() => {
    const id = userId || getSessionId();
    const assignedVariant = getVariant(experimentId, id);
    setVariant(assignedVariant);
    
    // Track experiment exposure
    trackEvent('experiment_exposure', {
      experiment_id: experimentId,
      variant: assignedVariant,
      user_id: id,
      timestamp: new Date().toISOString(),
    });
  }, [experimentId, userId]);
  
  return variant;
}

/**
 * Hook to check if a feature flag is enabled
 * Requirements: 30.3 - Feature flags for gradual rollout
 * 
 * @param flagId - The feature flag identifier
 * @param userId - Optional user ID (uses session ID if not provided)
 * @returns Whether the feature is enabled
 */
export function useFeatureFlag(flagId: string, userId?: string): boolean {
  const [enabled, setEnabled] = useState<boolean>(false);
  
  useEffect(() => {
    const id = userId || getSessionId();
    const isEnabled = isFeatureEnabled(flagId, id);
    setEnabled(isEnabled);
    
    // Track feature flag exposure
    trackEvent('feature_flag_exposure', {
      flag_id: flagId,
      enabled: isEnabled,
      user_id: id,
      timestamp: new Date().toISOString(),
    });
  }, [flagId, userId]);
  
  return enabled;
}

/**
 * Hook to track experiment conversion
 * Call this when a user completes the goal action for an experiment
 * 
 * @param experimentId - The experiment identifier
 * @param userId - Optional user ID (uses session ID if not provided)
 */
export function useExperimentConversion(experimentId: string, userId?: string) {
  const variant = useExperiment(experimentId, userId);
  
  const trackConversion = (metadata?: Record<string, any>) => {
    const id = userId || getSessionId();
    
    trackEvent('experiment_conversion', {
      experiment_id: experimentId,
      variant,
      user_id: id,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  };
  
  return { variant, trackConversion };
}
