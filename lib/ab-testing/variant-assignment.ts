/**
 * A/B Test Variant Assignment
 * Consistently assigns users to experiment variants
 * Requirements: 18.6, 30.3, 30.11
 */

import { EXPERIMENTS, FEATURE_FLAGS, type Experiment, type FeatureFlag } from './config';

/**
 * Generate a consistent hash from a string
 * Used for deterministic variant assignment
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
 * Get a consistent variant assignment for a user
 * Requirements: 30.11 - Users are consistently assigned to same variant
 * 
 * @param experimentId - The experiment identifier
 * @param userId - The user identifier (or session ID for anonymous users)
 * @returns The assigned variant name
 */
export function getVariant(experimentId: string, userId: string): string {
  const experiment = EXPERIMENTS[experimentId];
  
  if (!experiment) {
    console.warn(`Experiment ${experimentId} not found`);
    return 'control';
  }
  
  if (!experiment.enabled) {
    return experiment.defaultVariant;
  }
  
  // Check traffic allocation
  if (experiment.trafficAllocation !== undefined && experiment.trafficAllocation < 100) {
    const allocationHash = hashString(`${experimentId}:${userId}:allocation`);
    const allocationPercentage = allocationHash % 100;
    
    if (allocationPercentage >= experiment.trafficAllocation) {
      return experiment.defaultVariant;
    }
  }
  
  // Assign variant based on consistent hash
  const hash = hashString(`${experimentId}:${userId}`);
  const variantIndex = hash % experiment.variants.length;
  
  return experiment.variants[variantIndex];
}

/**
 * Check if a feature flag is enabled for a user
 * Requirements: 30.3 - Feature flags for gradual rollout
 * 
 * @param flagId - The feature flag identifier
 * @param userId - The user identifier (or session ID for anonymous users)
 * @returns Whether the feature is enabled for this user
 */
export function isFeatureEnabled(flagId: string, userId: string): boolean {
  const flag = FEATURE_FLAGS[flagId];
  
  if (!flag) {
    console.warn(`Feature flag ${flagId} not found`);
    return false;
  }
  
  if (!flag.enabled) {
    return false;
  }
  
  // Check rollout percentage
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    const hash = hashString(`${flagId}:${userId}`);
    const percentage = hash % 100;
    
    return percentage < flag.rolloutPercentage;
  }
  
  return true;
}

/**
 * Get all active variants for a user
 * Useful for analytics and debugging
 * 
 * @param userId - The user identifier
 * @returns Object mapping experiment IDs to assigned variants
 */
export function getAllVariants(userId: string): Record<string, string> {
  const variants: Record<string, string> = {};
  
  for (const experimentId in EXPERIMENTS) {
    variants[experimentId] = getVariant(experimentId, userId);
  }
  
  return variants;
}

/**
 * Get all enabled features for a user
 * Useful for analytics and debugging
 * 
 * @param userId - The user identifier
 * @returns Object mapping feature flag IDs to enabled status
 */
export function getAllFeatures(userId: string): Record<string, boolean> {
  const features: Record<string, boolean> = {};
  
  for (const flagId in FEATURE_FLAGS) {
    features[flagId] = isFeatureEnabled(flagId, userId);
  }
  
  return features;
}

/**
 * Get or create a session ID for anonymous users
 * Stored in localStorage for consistency across sessions
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }
  
  const storageKey = 'findam_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}
