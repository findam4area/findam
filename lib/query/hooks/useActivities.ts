/**
 * useActivities Hook
 * 
 * TanStack Query hooks for activity feed with realtime subscriptions
 * Implements Requirements 29.5, 29.8
 */

import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "../keys";

export interface Activity {
  id: string;
  type: 'listing' | 'purchase' | 'registration' | 'review';
  user_id: string;
  user_name: string;
  user_avatar?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Fetch recent activities
 * Requirement 29.5: Query hooks for data fetching
 */
export function useActivities(
  limit: number = 20,
  options?: Omit<UseQueryOptions<Activity[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.activities.recent(limit),
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as Activity[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute (activities are more time-sensitive)
    ...options,
  });
}

/**
 * Subscribe to realtime activity updates
 * Requirement 29.8: Realtime subscription integration
 * 
 * This hook sets up a realtime subscription to the activities table
 * and automatically updates the query cache when new activities arrive
 */
export function useRealtimeActivities(limit: number = 20) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  useEffect(() => {
    // Subscribe to new activities
    const channel = supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          // Update the query cache with the new activity
          queryClient.setQueryData<Activity[]>(
            queryKeys.activities.recent(limit),
            (oldData) => {
              if (!oldData) return [payload.new as Activity];
              
              // Add new activity to the beginning and limit to specified count
              return [payload.new as Activity, ...oldData].slice(0, limit);
            }
          );
        }
      )
      .subscribe();
    
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, limit]);
  
  // Return the query hook
  return useActivities(limit);
}

/**
 * Create a new activity
 * This is typically called from server actions or API routes
 */
export async function createActivity(activity: Omit<Activity, 'id' | 'created_at'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single();
  
  if (error) throw error;
  return data as Activity;
}
