/**
 * Listing Mutations
 * 
 * TanStack Query mutations for listing CRUD operations with query invalidation
 * Implements Requirement 29.6 (query invalidation on mutations)
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "../keys";
import type { Listing } from "@/lib/types";

interface CreateListingInput {
  title: string;
  description: string;
  price?: number;
  category_id: string;
  subcategory_id: string;
  condition?: "new" | "used" | "refurbished";
  state: string;
  lga: string;
  ward?: string;
  user_id: string;
}

interface UpdateListingInput extends Partial<CreateListingInput> {
  id: string;
}

/**
 * Create a new listing
 * Requirement 29.6: Invalidate listings queries on create
 */
export function useCreateListing() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<Listing, Error, CreateListingInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          ...input,
          is_active: true,
          views_count: 0,
          likes_count: 0,
          saves_count: 0,
        })
        .select(`
          *,
          user:users!listings_user_id_fkey(id, username, avatar_url),
          media:listing_media(*)
        `)
        .single();
      
      if (error) throw error;
      return data as unknown as Listing;
    },
    
    // Invalidate relevant queries on success (Requirement 29.6)
    onSuccess: (data) => {
      // Invalidate all listings queries
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      
      // Invalidate category-specific queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.byCategory(data.category_id) 
      });
      
      // Invalidate vendor-specific queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.byVendor(data.user_id) 
      });
      
      // Invalidate featured listings if boosted
      if (data.is_boosted) {
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.featured() });
      }
    },
  });
}

/**
 * Update an existing listing
 * Requirement 29.6: Invalidate listings queries on update
 */
export function useUpdateListing() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<Listing, Error, UpdateListingInput>({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          user:users!listings_user_id_fkey(id, username, avatar_url),
          media:listing_media(*)
        `)
        .single();
      
      if (error) throw error;
      return data as unknown as Listing;
    },
    
    // Invalidate relevant queries on success (Requirement 29.6)
    onSuccess: (data) => {
      // Invalidate the specific listing
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.detail(data.id) 
      });
      
      // Invalidate all listings queries
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      
      // Invalidate category-specific queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.byCategory(data.category_id) 
      });
      
      // Invalidate vendor-specific queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.byVendor(data.user_id) 
      });
      
      // Invalidate featured listings if boosted
      if (data.is_boosted) {
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.featured() });
      }
    },
  });
}

/**
 * Delete a listing
 * Requirement 29.6: Invalidate listings queries on delete
 */
export function useDeleteListing() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<void, Error, { id: string; userId: string; categoryId: string }>({
    mutationFn: async ({ id }) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('listings')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    
    // Invalidate relevant queries on success (Requirement 29.6)
    onSuccess: (data, variables) => {
      // Remove the specific listing from cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.listings.detail(variables.id) 
      });
      
      // Invalidate all listings queries
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      
      // Invalidate category-specific queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.byCategory(variables.categoryId) 
      });
      
      // Invalidate vendor-specific queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.byVendor(variables.userId) 
      });
      
      // Invalidate featured listings
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.featured() });
    },
  });
}

/**
 * Boost a listing
 * Requirement 29.6: Invalidate listings queries on boost
 */
export function useBoostListing() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<
    Listing,
    Error,
    { id: string; boostLevel: 1 | 2 | 3; durationDays: number }
  >({
    mutationFn: async ({ id, boostLevel, durationDays }) => {
      const boostExpiresAt = new Date();
      boostExpiresAt.setDate(boostExpiresAt.getDate() + durationDays);
      
      const { data, error } = await supabase
        .from('listings')
        .update({
          is_boosted: true,
          boost_level: boostLevel,
          boost_expires_at: boostExpiresAt.toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          user:users!listings_user_id_fkey(id, username, avatar_url),
          media:listing_media(*)
        `)
        .single();
      
      if (error) throw error;
      return data as unknown as Listing;
    },
    
    // Invalidate relevant queries on success
    onSuccess: (data) => {
      // Invalidate the specific listing
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.detail(data.id) 
      });
      
      // Invalidate featured listings (boosted listings appear here)
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.featured() });
      
      // Invalidate all listings queries
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
  });
}
