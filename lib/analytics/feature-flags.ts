/**
 * Feature Flags and A/B Testing Framework
 * Requirements: 18.6, 30.3, 30.7
 * Task 16.2: Enhanced with gradual rollout and improved variant assignment
 */

import posthog from 'posthog-js';
import { ANALYTICS_CONFIG } from './config';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  variant?: string;
  rolloutPercentage?: number; // 0-100 for gradual rollout
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100, total should be 100
}

export interface ABTest {
  key: string;
  variants: ABTestVariant[];
  enabled: boolean;
  rolloutPercentage?: number; // Optional gradual rollout
}

export interface GradualRolloutConfig {
  key: string;
  percentage: number; // 0-100
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Hash a string to a number (for consistent user assignments)
 * Used for gradual rollout and A/B testing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get user identifier for consistent feature flag assignments
 */
function getUserIdentifier(): string {
  if (typeof window === 'undefined') return 'server';
  
  // Try to get PostHog distinct ID first
  if (ANALYTICS_CONFIG.posthog.enabled && posthog.__loaded) {
    try {
      const distinctId = posthog.get_distinct_id();
      if (distinctId) return distinctId;
    } catch (e) {
      // Fall through to other methods
    }
  }
  
  // Fall back to localStorage
  let userId = localStorage.getItem('user_id_for_rollout');
  if (!userId) {
    userId = `anon_${Math.random().toString(36).substring(7)}_${Date.now()}`;
    localStorage.setItem('user_id_for_rollout', userId);
  }
  return userId;
}

/**
 * Check if user is in rollout percentage (for gradual rollout)
 * Uses consistent hashing to ensure same user always gets same result
 * Task 16.2: Gradual rollout implementation
 * 
 * @param key - Feature flag or test key
 * @param percentage - Percentage of users to include (0-100)
 * @returns Whether user is in rollout
 */
export function isUserInRollout(key: string, percentage: number): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  
  const userId = getUserIdentifier();
  const hash = hashString(`${key}_${userId}`);
  const bucket = hash % 100;
  
  return bucket < percentage;
}

/**
 * Check if a feature flag is enabled with gradual rollout support
 * Task 16.2: Enhanced with gradual rollout
 * Requirements: 30.3
 * 
 * @param flagKey - Feature flag key
 * @param defaultValue - Default value if flag is not set
 * @param rolloutPercentage - Optional percentage for gradual rollout (0-100)
 * @returns Whether the flag is enabled for this user
 */
export function isFeatureEnabled(
  flagKey: string,
  defaultValue: boolean = false,
  rolloutPercentage?: number
): boolean {
  // Check gradual rollout first if specified
  if (rolloutPercentage !== undefined) {
    if (!isUserInRollout(flagKey, rolloutPercentage)) {
      return false;
    }
  }
  
  if (!ANALYTICS_CONFIG.posthog.enabled || !posthog.__loaded) {
    return defaultValue;
  }

  const flagValue = posthog.isFeatureEnabled(flagKey);
  
  // If flag is undefined, return default
  if (flagValue === undefined) {
    return defaultValue;
  }
  
  return Boolean(flagValue);
}

/**
 * Get feature flag variant
 * Requirements: 30.3
 * 
 * @param flagKey - Feature flag key
 * @returns The variant value or undefined
 */
export function getFeatureVariant(
  flagKey: string
): string | boolean | undefined {
  if (!ANALYTICS_CONFIG.posthog.enabled || !posthog.__loaded) {
    return undefined;
  }

  return posthog.getFeatureFlag(flagKey);
}

/**
 * Get A/B test variant for user with gradual rollout support
 * Uses consistent hashing to ensure users always see the same variant
 * Task 16.2: Enhanced with gradual rollout and better tracking
 * Requirements: 30.3, 30.11 (Property 19: A/B Test Variant Consistency)
 * 
 * @param testKey - A/B test key
 * @param defaultVariant - Default variant if test is not active
 * @param rolloutPercentage - Optional percentage for gradual rollout (0-100)
 * @returns The assigned variant
 */
export function getABTestVariant(
  testKey: string,
  defaultVariant: string = 'control',
  rolloutPercentage?: number
): string {
  // Check gradual rollout first if specified
  if (rolloutPercentage !== undefined) {
    if (!isUserInRollout(testKey, rolloutPercentage)) {
      return defaultVariant;
    }
  }
  
  if (!ANALYTICS_CONFIG.posthog.enabled || !posthog.__loaded) {
    return defaultVariant;
  }

  const variant = posthog.getFeatureFlag(testKey);
  
  // Return variant as string, fallback to default
  return typeof variant === 'string' ? variant : defaultVariant;
}

/**
 * Track A/B test exposure with enhanced metadata
 * Task 16.2: Enhanced exposure tracking
 * Requirements: 30.6
 * 
 * @param testKey - A/B test key
 * @param variant - The variant shown to the user
 * @param metadata - Additional metadata about the exposure
 */
export function trackABTestExposure(
  testKey: string,
  variant: string,
  metadata?: Record<string, any>
) {
  if (!ANALYTICS_CONFIG.posthog.enabled || !posthog.__loaded) {
    return;
  }

  posthog.capture('$feature_flag_called', {
    $feature_flag: testKey,
    $feature_flag_response: variant,
    exposure_timestamp: new Date().toISOString(),
    ...metadata,
  });
  
  // Also track as custom event for easier analysis
  posthog.capture('ab_test_exposure', {
    test_key: testKey,
    variant,
    ...metadata,
  });
}

/**
 * Client-side A/B test assignment with improved consistency
 * Uses localStorage to ensure consistent variant assignment
 * Task 16.2: Enhanced with better variant assignment logic
 * Requirements: 30.11 (Property 19: A/B Test Variant Consistency)
 * 
 * @param testKey - A/B test key
 * @param variants - List of variant configurations
 * @param rolloutPercentage - Optional percentage for gradual rollout (0-100)
 * @returns Assigned variant
 */
export function assignABTestVariant(
  testKey: string,
  variants: ABTestVariant[],
  rolloutPercentage?: number
): string {
  // Check gradual rollout first if specified
  if (rolloutPercentage !== undefined) {
    if (!isUserInRollout(testKey, rolloutPercentage)) {
      return 'control'; // Default variant for users outside rollout
    }
  }
  
  // Check if user already has assigned variant
  const storageKey = `ab_test_${testKey}`;
  const storedVariant = localStorage.getItem(storageKey);
  
  if (storedVariant) {
    // Verify stored variant is still valid
    const isValid = variants.some(v => v.id === storedVariant);
    if (isValid) {
      return storedVariant;
    }
  }
  
  // Assign new variant based on weights using consistent hashing
  const userId = getUserIdentifier();
  const hash = hashString(`${testKey}_${userId}`);
  
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const bucket = hash % totalWeight;
  
  let cumulative = 0;
  let assignedVariant = variants[0].id; // fallback
  
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      assignedVariant = variant.id;
      break;
    }
  }
  
  // Store assignment for consistency
  localStorage.setItem(storageKey, assignedVariant);
  
  // Track assignment
  if (ANALYTICS_CONFIG.posthog.enabled && posthog.__loaded) {
    posthog.capture('ab_test_assigned', {
      test_key: testKey,
      variant: assignedVariant,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
  }
  
  return assignedVariant;
}

/**
 * Reset A/B test assignment (useful for testing)
 * 
 * @param testKey - A/B test key
 */
export function resetABTestVariant(testKey: string) {
  const storageKey = `ab_test_${testKey}`;
  localStorage.removeItem(storageKey);
}

/**
 * Common feature flags used in the application
 */
export const FEATURE_FLAGS = {
  // Homepage features
  ENABLE_PERSONALIZED_RECOMMENDATIONS: 'enable_personalized_recommendations',
  ENABLE_SEMANTIC_SEARCH: 'enable_semantic_search',
  ENABLE_REALTIME_ACTIVITY_FEED: 'enable_realtime_activity_feed',
  
  // UI features
  ENABLE_GLASSMORPHISM: 'enable_glassmorphism',
  ENABLE_PARALLAX_EFFECTS: 'enable_parallax_effects',
  
  // Premium features
  ENABLE_VIDEO_LISTINGS: 'enable_video_listings',
  ENABLE_BOOST: 'enable_boost',
  
  // Experimental features
  ENABLE_AI_DESCRIPTIONS: 'enable_ai_descriptions',
  ENABLE_TREND_ANALYSIS: 'enable_trend_analysis',
} as const;

/**
 * Common A/B tests
 */
export const AB_TESTS = {
  HOMEPAGE_HERO_VARIANT: 'homepage_hero_variant',
  CTA_BUTTON_TEXT: 'cta_button_text',
  LISTING_CARD_LAYOUT: 'listing_card_layout',
  SEARCH_BAR_POSITION: 'search_bar_position',
} as const;

/**
 * Gradual rollout management functions
 * Task 16.2: New gradual rollout features
 */

/**
 * Get current rollout percentage for a feature
 * 
 * @param key - Feature key
 * @returns Current rollout percentage (0-100)
 */
export function getRolloutPercentage(key: string): number {
  const storageKey = `rollout_${key}`;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.percentage || 0;
  }
  return 0;
}

/**
 * Set rollout percentage for a feature (for testing/admin)
 * 
 * @param key - Feature key
 * @param percentage - Rollout percentage (0-100)
 */
export function setRolloutPercentage(key: string, percentage: number): void {
  const storageKey = `rollout_${key}`;
  localStorage.setItem(storageKey, JSON.stringify({
    percentage: Math.max(0, Math.min(100, percentage)),
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Track feature rollout metrics
 * Task 16.2: Rollout tracking
 * 
 * @param featureKey - Feature key
 * @param enabled - Whether feature is enabled for this user
 * @param percentage - Current rollout percentage
 */
export function trackFeatureRollout(
  featureKey: string,
  enabled: boolean,
  percentage: number
): void {
  if (!ANALYTICS_CONFIG.posthog.enabled || !posthog.__loaded) {
    return;
  }

  posthog.capture('feature_rollout_exposure', {
    feature_key: featureKey,
    enabled,
    rollout_percentage: percentage,
    user_in_rollout: enabled,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get all A/B test and feature flag assignments for current user
 * Useful for debugging and admin dashboards
 * Task 16.2: Assignment visibility
 * 
 * @returns Map of test/flag keys to their assigned values
 */
export function getAllAssignments(): Record<string, string | boolean> {
  const assignments: Record<string, string | boolean> = {};
  
  // Get all A/B test assignments from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ab_test_')) {
      const testKey = key.replace('ab_test_', '');
      const variant = localStorage.getItem(key);
      if (variant) {
        assignments[testKey] = variant;
      }
    }
  }
  
  // Get feature flags from PostHog if available
  if (ANALYTICS_CONFIG.posthog.enabled && posthog.__loaded) {
    try {
      // Iterate through known feature flags
      for (const flagKey of Object.values(FEATURE_FLAGS)) {
        const flagValue = posthog.getFeatureFlag(flagKey);
        if (flagValue !== undefined) {
          assignments[flagKey] = flagValue;
        }
      }
      
      // Iterate through known A/B tests
      for (const testKey of Object.values(AB_TESTS)) {
        const testValue = posthog.getFeatureFlag(testKey);
        if (testValue !== undefined) {
          assignments[testKey] = testValue;
        }
      }
    } catch (e) {
      // Silent fail
    }
  }
  
  return assignments;
}

/**
 * Clear all A/B test assignments (useful for testing)
 * Task 16.2: Testing utilities
 */
export function clearAllAssignments(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ab_test_') || key?.startsWith('rollout_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
