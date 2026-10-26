/**
 * Cohort Analysis for User Retention
 * Task 16.2: Enhanced with additional retention metrics
 * Tracks user retention metrics by cohort
 * Requirements: 18.6, 30.7
 */

import { createClient } from '@/lib/supabase/server';
import posthog from 'posthog-js';
import { ANALYTICS_CONFIG } from './config';

export interface CohortData {
  cohortDate: string; // YYYY-MM-DD
  cohortSize: number;
  retention: {
    day1: number;
    day7: number;
    day14: number;
    day30: number;
    day60?: number; // Task 16.2: Extended retention tracking
    day90?: number;
  };
  engagement?: {
    avgSessionsPerUser: number;
    avgActionsPerUser: number;
    avgTimeSpentMinutes: number;
  };
}

export interface RetentionMetrics {
  cohorts: CohortData[];
  overallRetention: {
    day1: number;
    day7: number;
    day14: number;
    day30: number;
    day60: number;
    day90: number;
  };
  churnRate: {
    day1: number;
    day7: number;
    day14: number;
    day30: number;
  };
}

export interface UserSegment {
  segmentName: string;
  userIds: string[];
  characteristics: Record<string, any>;
}

/**
 * Calculate cohort retention metrics with extended tracking
 * Task 16.2: Enhanced with day 60 and day 90 retention
 * Requirements: 30.7
 * 
 * @param startDate - Start date for cohort analysis
 * @param endDate - End date for cohort analysis
 * @returns Cohort retention data with churn rates
 */
export async function calculateCohortRetention(
  startDate: Date,
  endDate: Date
): Promise<RetentionMetrics> {
  const supabase = await createClient();
  
  // Get user registration cohorts
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });
  
  if (error || !users) {
    console.error('Error fetching cohort data:', error);
    return {
      cohorts: [],
      overallRetention: { day1: 0, day7: 0, day14: 0, day30: 0, day60: 0, day90: 0 },
      churnRate: { day1: 0, day7: 0, day14: 0, day30: 0 },
    };
  }
  
  // Group users by cohort (by day)
  const cohortMap = new Map<string, string[]>();
  
  for (const user of users) {
    if (!user.created_at) continue;
    const cohortDate = new Date(user.created_at).toISOString().split('T')[0];
    if (!cohortMap.has(cohortDate)) {
      cohortMap.set(cohortDate, []);
    }
    cohortMap.get(cohortDate)!.push(user.id);
  }
  
  // Calculate retention for each cohort
  const cohorts: CohortData[] = [];
  let totalDay1 = 0, totalDay7 = 0, totalDay14 = 0, totalDay30 = 0, totalDay60 = 0, totalDay90 = 0;
  let totalCohortSize = 0;
  
  for (const [cohortDate, userIds] of cohortMap.entries()) {
    const cohortSize = userIds.length;
    totalCohortSize += cohortSize;
    
    // Calculate retention for different time periods
    const retention = await calculateRetentionForCohort(
      userIds,
      new Date(cohortDate)
    );
    
    // Calculate engagement metrics
    const engagement = await calculateCohortEngagement(
      userIds,
      new Date(cohortDate)
    );
    
    cohorts.push({
      cohortDate,
      cohortSize,
      retention,
      engagement,
    });
    
    totalDay1 += retention.day1 * cohortSize;
    totalDay7 += retention.day7 * cohortSize;
    totalDay14 += retention.day14 * cohortSize;
    totalDay30 += retention.day30 * cohortSize;
    totalDay60 += (retention.day60 || 0) * cohortSize;
    totalDay90 += (retention.day90 || 0) * cohortSize;
  }
  
  // Calculate overall retention
  const overallRetention = {
    day1: totalCohortSize > 0 ? totalDay1 / totalCohortSize : 0,
    day7: totalCohortSize > 0 ? totalDay7 / totalCohortSize : 0,
    day14: totalCohortSize > 0 ? totalDay14 / totalCohortSize : 0,
    day30: totalCohortSize > 0 ? totalDay30 / totalCohortSize : 0,
    day60: totalCohortSize > 0 ? totalDay60 / totalCohortSize : 0,
    day90: totalCohortSize > 0 ? totalDay90 / totalCohortSize : 0,
  };
  
  // Calculate churn rates (1 - retention)
  const churnRate = {
    day1: 1 - overallRetention.day1,
    day7: 1 - overallRetention.day7,
    day14: 1 - overallRetention.day14,
    day30: 1 - overallRetention.day30,
  };
  
  return {
    cohorts,
    overallRetention,
    churnRate,
  };
}

/**
 * Calculate retention percentages for a specific cohort with extended periods
 * Task 16.2: Added day 60 and day 90 tracking
 */
async function calculateRetentionForCohort(
  userIds: string[],
  cohortDate: Date
): Promise<CohortData['retention']> {
  const supabase = await createClient();
  
  const day1Date = new Date(cohortDate);
  day1Date.setDate(day1Date.getDate() + 1);
  
  const day7Date = new Date(cohortDate);
  day7Date.setDate(day7Date.getDate() + 7);
  
  const day14Date = new Date(cohortDate);
  day14Date.setDate(day14Date.getDate() + 14);
  
  const day30Date = new Date(cohortDate);
  day30Date.setDate(day30Date.getDate() + 30);
  
  const day60Date = new Date(cohortDate);
  day60Date.setDate(day60Date.getDate() + 60);
  
  const day90Date = new Date(cohortDate);
  day90Date.setDate(day90Date.getDate() + 90);
  
  // Count active users on each day
  const day1Active = await countActiveUsers(userIds, cohortDate, day1Date);
  const day7Active = await countActiveUsers(userIds, cohortDate, day7Date);
  const day14Active = await countActiveUsers(userIds, cohortDate, day14Date);
  const day30Active = await countActiveUsers(userIds, cohortDate, day30Date);
  const day60Active = await countActiveUsers(userIds, cohortDate, day60Date);
  const day90Active = await countActiveUsers(userIds, cohortDate, day90Date);
  
  const cohortSize = userIds.length;
  
  return {
    day1: cohortSize > 0 ? day1Active / cohortSize : 0,
    day7: cohortSize > 0 ? day7Active / cohortSize : 0,
    day14: cohortSize > 0 ? day14Active / cohortSize : 0,
    day30: cohortSize > 0 ? day30Active / cohortSize : 0,
    day60: cohortSize > 0 ? day60Active / cohortSize : 0,
    day90: cohortSize > 0 ? day90Active / cohortSize : 0,
  };
}

/**
 * Count active users in a time period
 * Active = had any interaction (view, like, save, etc.)
 */
async function countActiveUsers(
  userIds: string[],
  startDate: Date,
  endDate: Date
): Promise<number> {
  const supabase = await createClient();
  
  // Check user_interactions table for activity
  const { data, error } = await supabase
    .from('user_interactions')
    .select('user_id')
    .in('user_id', userIds)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  if (error || !data) {
    console.error('Error counting active users:', error);
    return 0;
  }
  
  // Count unique users
  const uniqueUsers = new Set(data.map(row => row.user_id));
  return uniqueUsers.size;
}

/**
 * Calculate engagement metrics for a cohort
 * Task 16.2: New engagement tracking
 */
async function calculateCohortEngagement(
  userIds: string[],
  cohortDate: Date
): Promise<CohortData['engagement']> {
  const supabase = await createClient();
  
  // Get all interactions for this cohort in first 30 days
  const endDate = new Date(cohortDate);
  endDate.setDate(endDate.getDate() + 30);
  
  const { data: interactions, error } = await supabase
    .from('user_interactions')
    .select('user_id, interaction_type, created_at')
    .in('user_id', userIds)
    .gte('created_at', cohortDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  if (error || !interactions) {
    return {
      avgSessionsPerUser: 0,
      avgActionsPerUser: 0,
      avgTimeSpentMinutes: 0,
    };
  }
  
  // Calculate metrics
  const userActions = new Map<string, number>();
  interactions.forEach(interaction => {
    const count = userActions.get(interaction.user_id) || 0;
    userActions.set(interaction.user_id, count + 1);
  });
  
  const totalActions = interactions.length;
  const activeUsers = userActions.size;
  const avgActionsPerUser = activeUsers > 0 ? totalActions / activeUsers : 0;
  
  // Estimate sessions (group interactions within 30 min as one session)
  const sessions = estimateSessions(interactions);
  const avgSessionsPerUser = activeUsers > 0 ? sessions / activeUsers : 0;
  
  // Estimate time spent (rough approximation)
  const avgTimeSpentMinutes = avgSessionsPerUser * 5; // Assume 5 min per session
  
  return {
    avgSessionsPerUser,
    avgActionsPerUser,
    avgTimeSpentMinutes,
  };
}

/**
 * Estimate number of sessions from interactions
 * Groups interactions within 30 minutes as one session
 */
function estimateSessions(
  interactions: Array<{ user_id: string; created_at: string }>
): number {
  // Sort by user and time
  const sorted = [...interactions].sort((a, b) => {
    if (a.user_id !== b.user_id) {
      return a.user_id.localeCompare(b.user_id);
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  let sessions = 0;
  let lastUserId = '';
  let lastTime = 0;
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  for (const interaction of sorted) {
    const currentTime = new Date(interaction.created_at).getTime();
    
    if (
      interaction.user_id !== lastUserId ||
      currentTime - lastTime > SESSION_TIMEOUT
    ) {
      sessions++;
      lastUserId = interaction.user_id;
    }
    
    lastTime = currentTime;
  }
  
  return sessions;
}

/**
 * Get user's cohort information
 * Requirements: 30.7
 */
export async function getUserCohort(userId: string): Promise<{
  cohortDate: string;
  daysActive: number;
  lastActiveDate: string;
} | null> {
  const supabase = await createClient();
  
  // Get user registration date
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single();
  
  if (profileError || !profile) {
    return null;
  }
  
  // Get last activity date
  const { data: lastActivity, error: activityError } = await supabase
    .from('user_interactions')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!profile.created_at) {
    throw new Error('User profile missing created_at timestamp');
  }
  
  const cohortDate = new Date(profile.created_at).toISOString().split('T')[0];
  const lastActiveDate = lastActivity && lastActivity.created_at
    ? new Date(lastActivity.created_at).toISOString().split('T')[0]
    : cohortDate;
  
  // Calculate days active
  const registrationDate = new Date(profile.created_at);
  const lastActive = new Date(lastActiveDate);
  const daysActive = Math.floor(
    (lastActive.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return {
    cohortDate,
    daysActive,
    lastActiveDate,
  };
}

/**
 * Segment users for targeted analysis
 * Task 16.2: User segmentation for cohort analysis
 * 
 * @param segmentCriteria - Criteria for segmentation
 * @returns User segments
 */
export async function segmentUsers(
  segmentCriteria: {
    activityLevel?: 'high' | 'medium' | 'low';
    subscriptionTier?: string;
    registrationPeriod?: { start: Date; end: Date };
    minInteractions?: number;
  }
): Promise<UserSegment[]> {
  const supabase = await createClient();
  
  let query = supabase.from('profiles').select('id, created_at');
  
  // Apply registration period filter
  if (segmentCriteria.registrationPeriod) {
    query = query
      .gte('created_at', segmentCriteria.registrationPeriod.start.toISOString())
      .lte('created_at', segmentCriteria.registrationPeriod.end.toISOString());
  }
  
  // Apply subscription tier filter
  if (segmentCriteria.subscriptionTier) {
    query = query.eq('premium_tier', segmentCriteria.subscriptionTier);
  }
  
  const { data: users, error } = await query;
  
  if (error || !users) {
    return [];
  }
  
  const segments: UserSegment[] = [];
  
  // Segment by activity level if specified
  if (segmentCriteria.activityLevel) {
    const userIds = users.map(u => u.id);
    const userActivityCounts = await getUserActivityCounts(userIds);
    
    const thresholds = {
      high: 50,
      medium: 10,
      low: 0,
    };
    
    const segmentedUsers = userIds.filter(userId => {
      const count = userActivityCounts.get(userId) || 0;
      if (segmentCriteria.activityLevel === 'high') {
        return count >= thresholds.high;
      } else if (segmentCriteria.activityLevel === 'medium') {
        return count >= thresholds.medium && count < thresholds.high;
      } else {
        return count < thresholds.medium;
      }
    });
    
    segments.push({
      segmentName: `${segmentCriteria.activityLevel}_activity`,
      userIds: segmentedUsers,
      characteristics: {
        activityLevel: segmentCriteria.activityLevel,
        userCount: segmentedUsers.length,
      },
    });
  }
  
  return segments;
}

/**
 * Get activity counts for users
 */
async function getUserActivityCounts(
  userIds: string[]
): Promise<Map<string, number>> {
  const supabase = await createClient();
  
  const { data: interactions, error } = await supabase
    .from('user_interactions')
    .select('user_id')
    .in('user_id', userIds);
  
  if (error || !interactions) {
    return new Map();
  }
  
  const counts = new Map<string, number>();
  for (const interaction of interactions) {
    const count = counts.get(interaction.user_id) || 0;
    counts.set(interaction.user_id, count + 1);
  }
  
  return counts;
}

/**
 * Track cohort to PostHog for advanced analysis
 * Task 16.2: PostHog cohort integration
 * 
 * @param userId - User ID
 * @param cohortData - Cohort information
 */
export function trackUserCohort(
  userId: string,
  cohortData: {
    cohortDate: string;
    daysActive: number;
    segment?: string;
  }
): void {
  if (!ANALYTICS_CONFIG.posthog.enabled || !posthog.__loaded) {
    return;
  }

  // Set user properties for cohort analysis in PostHog
  posthog.people.set({
    cohort_date: cohortData.cohortDate,
    days_active: cohortData.daysActive,
    user_segment: cohortData.segment || 'default',
  });

  // Capture cohort assignment event
  posthog.capture('user_cohort_assigned', {
    cohort_date: cohortData.cohortDate,
    days_active: cohortData.daysActive,
    segment: cohortData.segment,
  });
}

/**
 * Calculate retention curve for visualization
 * Task 16.2: Retention curve data
 * 
 * @param cohortDate - Cohort date
 * @returns Daily retention rates for the first 90 days
 */
export async function getRetentionCurve(
  cohortDate: Date
): Promise<Array<{ day: number; retention: number }>> {
  const supabase = await createClient();
  
  // Get users in cohort
  const cohortDateStr = cohortDate.toISOString().split('T')[0];
  const nextDay = new Date(cohortDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .gte('created_at', cohortDate.toISOString())
    .lt('created_at', nextDay.toISOString());
  
  if (error || !users) {
    return [];
  }
  
  const userIds = users.map(u => u.id);
  const cohortSize = userIds.length;
  
  if (cohortSize === 0) return [];
  
  // Calculate retention for each day up to 90 days
  const retentionCurve: Array<{ day: number; retention: number }> = [];
  
  for (let day = 1; day <= 90; day++) {
    const targetDate = new Date(cohortDate);
    targetDate.setDate(targetDate.getDate() + day);
    
    const activeUsers = await countActiveUsers(userIds, cohortDate, targetDate);
    const retention = activeUsers / cohortSize;
    
    retentionCurve.push({ day, retention });
  }
  
  return retentionCurve;
}
