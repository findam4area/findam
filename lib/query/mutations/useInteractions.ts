/**
 * Interaction Mutations
 * 
 * TanStack Query mutations for user interactions with optimistic updates
 * Implements Requirements 29.4 (optimistic updates with rollback)
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "../keys";
import type { Listing } from "@/lib/types";

interface OptimisticContext {
  previousData?: any;
}

/**
 * Like a listing with optimistic update
 * Requirement 29.4: Optimistic updates with rollback on failure
 */
export function useLikeListing() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<
    void,
    Error,
    { listingId: string; userId: string },
    OptimisticContext
  >({
    mutationFn: async ({ listingId, userId }) => {
      // Check if already liked
      const { data: existing } = await supabase
        .from('user_interactions')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .eq('interaction_type', 'like')
        .maybeSingle();
      
      if (existing) {
        // Unlike: delete the interaction
        const { error } = await supabase
          .from('user_interactions')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        
        // Decrement likes count manually
        const { data: currentListing } = await supabase
          .from('listings')
          .select('likes_count')
          .eq('id', listingId)
          .single();
        
        if (currentListing && currentListing.likes_count !== null) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ likes_count: Math.max(0, currentListing.likes_count - 1) })
            .eq('id', listingId);
          
          if (updateError) throw updateError;
        }
      } else {
        // Like: insert the interaction
        const { error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: userId,
            listing_id: listingId,
            interaction_type: 'like',
          });
        
        if (error) throw error;
        
        // Increment likes count manually
        const { data: currentListing } = await supabase
          .from('listings')
          .select('likes_count')
          .eq('id', listingId)
          .single();
        
        if (currentListing && currentListing.likes_count !== null) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ likes_count: currentListing.likes_count + 1 })
            .eq('id', listingId);
          
          if (updateError) throw updateError;
        }
      }
    },
    
    // Optimistic update
    onMutate: async ({ listingId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.detail(listingId) });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<Listing>(
        queryKeys.listings.detail(listingId)
      );
      
      // Optimistically update the listing
      if (previousData) {
        queryClient.setQueryData<Listing>(
          queryKeys.listings.detail(listingId),
          {
            ...previousData,
            likes_count: previousData.likes_count + 1,
          }
        );
      }
      
      // Return context with snapshot
      return { previousData };
    },
    
    // Rollback on error (Requirement 29.4)
    onError: (err, { listingId }, context) => {
      // Restore previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.listings.detail(listingId),
          context.previousData
        );
      }
    },
    
    // Refetch on success or error
    onSettled: (data, error, { listingId, userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(listingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions.likes(userId) as readonly unknown[] });
    },
  });
}

/**
 * Save a listing with optimistic update
 * Requirement 29.4: Optimistic updates with rollback on failure
 */
export function useSaveListing() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<
    void,
    Error,
    { listingId: string; userId: string },
    OptimisticContext
  >({
    mutationFn: async ({ listingId, userId }) => {
      // Check if already saved
      const { data: existing } = await supabase
        .from('user_interactions')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .eq('interaction_type', 'save')
        .maybeSingle();
      
      if (existing) {
        // Unsave: delete the interaction
        const { error } = await supabase
          .from('user_interactions')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        
        // Decrement saves count manually
        const { data: currentListing } = await supabase
          .from('listings')
          .select('saves_count')
          .eq('id', listingId)
          .single();
        
        if (currentListing && currentListing.saves_count !== null) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ saves_count: Math.max(0, currentListing.saves_count - 1) })
            .eq('id', listingId);
          
          if (updateError) throw updateError;
        }
      } else {
        // Save: insert the interaction
        const { error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: userId,
            listing_id: listingId,
            interaction_type: 'save',
          });
        
        if (error) throw error;
        
        // Increment saves count manually
        const { data: currentListing } = await supabase
          .from('listings')
          .select('saves_count')
          .eq('id', listingId)
          .single();
        
        if (currentListing && currentListing.saves_count !== null) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ saves_count: currentListing.saves_count + 1 })
            .eq('id', listingId);
          
          if (updateError) throw updateError;
        }
      }
    },
    
    // Optimistic update
    onMutate: async ({ listingId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.detail(listingId) });
      
      const previousData = queryClient.getQueryData<Listing>(
        queryKeys.listings.detail(listingId)
      );
      
      if (previousData) {
        queryClient.setQueryData<Listing>(
          queryKeys.listings.detail(listingId),
          {
            ...previousData,
            saves_count: previousData.saves_count + 1,
          }
        );
      }
      
      return { previousData };
    },
    
    // Rollback on error
    onError: (err, { listingId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.listings.detail(listingId),
          context.previousData
        );
      }
    },
    
    onSettled: (data, error, { listingId, userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(listingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions.saves(userId) as readonly unknown[] });
    },
  });
}

/**
 * Follow a vendor with optimistic update
 * Requirement 29.4: Optimistic updates with rollback on failure
 */
export function useFollowVendor() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<
    void,
    Error,
    { vendorId: string; userId: string },
    OptimisticContext
  >({
    mutationFn: async ({ vendorId, userId }) => {
      // Check if already following using storefront_followers table
      const { data: existing } = await supabase
        .from('storefront_followers')
        .select('id')
        .eq('follower_user_id', userId)
        .eq('storefront_id', vendorId)
        .maybeSingle();
      
      if (existing) {
        // Unfollow
        const { error } = await supabase
          .from('storefront_followers')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('storefront_followers')
          .insert({
            follower_user_id: userId,
            storefront_id: vendorId,
          });
        
        if (error) throw error;
      }
    },
    
    // Optimistic update
    onMutate: async ({ vendorId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
      
      const previousData = queryClient.getQueryData(
        queryKeys.vendors.detail(vendorId)
      );
      
      // Note: We'd need to track follow status in the vendor data structure
      // For now, we just return the context for rollback
      
      return { previousData };
    },
    
    // Rollback on error
    onError: (err, { vendorId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.vendors.detail(vendorId),
          context.previousData
        );
      }
    },
    
    onSettled: (data, error, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

/**
 * Track a view interaction
 * This doesn't need optimistic updates as it's fire-and-forget
 */
export function useTrackView() {
  const supabase = createClient();
  
  return useMutation({
    mutationFn: async ({ listingId, userId }: { listingId: string; userId?: string }) => {
      // Insert view interaction
      if (userId) {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: userId,
            listing_id: listingId,
            interaction_type: 'view',
          });
      }
      
      // Increment views count manually
      const { data: currentListing } = await supabase
        .from('listings')
        .select('views_count')
        .eq('id', listingId)
        .single();
      
      if (currentListing && currentListing.views_count !== null) {
        await supabase
          .from('listings')
          .update({ views_count: currentListing.views_count + 1 })
          .eq('id', listingId);
      }
    },
  });
}
