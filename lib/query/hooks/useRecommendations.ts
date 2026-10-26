/**
 * useRecommendations Hook
 * 
 * TanStack Query hooks for personalized recommendations with user-based caching
 * Implements Requirements 29.5, 29.8
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "../keys";
import type { Listing } from "@/lib/types";

/**
 * Fetch personalized recommendations for a user
 * Requirement 29.5: Query hooks for data fetching
 * Requirement 29.8: User-based caching
 * 
 * For authenticated users: Returns recommendations based on browsing history
 * For anonymous users: Returns trending listings
 */
export function useRecommendations(
  userId?: string,
  options?: Omit<UseQueryOptions<Listing[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.recommendations.forUser(userId),
    queryFn: async () => {
      const supabase = createClient();
      
      if (userId) {
        // For authenticated users, fetch personalized recommendations
        // This would typically use a recommendation algorithm or vector similarity
        // For now, we'll fetch listings from categories the user has viewed
        
        // Get user's recently viewed categories
        const { data: viewedCategories, error: viewError } = await supabase
          .from('user_interactions')
          .select('listing:listings(category_id)')
          .eq('user_id', userId)
          .eq('interaction_type', 'view')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (viewError) throw viewError;
        
        // Extract unique category IDs
        const categoryIds = Array.from(
          new Set(
            viewedCategories
              ?.map(v => v.listing?.category_id)
              .filter(Boolean) as string[]
          )
        );
        
        if (categoryIds.length > 0) {
          // Fetch listings from these categories, excluding already viewed
          const { data: viewedListingIds } = await supabase
            .from('user_interactions')
            .select('listing_id')
            .eq('user_id', userId)
            .eq('interaction_type', 'view')
            .order('created_at', { ascending: false })
            .limit(50);
          
          const excludeIds = viewedListingIds?.map(v => v.listing_id) || [];
          
          const { data, error } = await supabase
            .from('listings')
            .select(`
              *,
              user:users!listings_user_id_fkey(id, username, avatar_url),
              media:listing_media(*)
            `)
            .eq('is_active', true)
            .in('category_id', categoryIds)
            .not('id', 'in', `(${excludeIds.join(',')})`)
            .order('created_at', { ascending: false })
            .limit(8);
          
          if (error) throw error;
          return data as unknown as Listing[];
        }
      }
      
      // For anonymous users or users with no history, return trending listings
      return fetchTrendingListings();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (recommendations can be cached longer)
    ...options,
  });
}

/**
 * Fetch trending listings
 * Used as fallback for anonymous users or when personalized recommendations aren't available
 */
export function useTrendingListings(
  options?: Omit<UseQueryOptions<Listing[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.recommendations.trending(),
    queryFn: fetchTrendingListings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Helper function to fetch trending listings
 * Based on views, likes, and recency
 */
async function fetchTrendingListings(): Promise<Listing[]> {
  const supabase = createClient();
  
  // Fetch listings with high engagement (views + likes) from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      user:users!listings_user_id_fkey(id, username, avatar_url),
      media:listing_media(*)
    `)
    .eq('is_active', true)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('views_count', { ascending: false })
    .order('likes_count', { ascending: false })
    .limit(8);
  
  if (error) throw error;
  return data as unknown as Listing[];
}

/**
 * Fetch similar listings based on a listing ID
 * This would typically use vector similarity search with pgvector
 */
export function useSimilarListings(
  listingId: string,
  options?: Omit<UseQueryOptions<Listing[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.listings.detail(listingId), 'similar'],
    queryFn: async () => {
      const supabase = createClient();
      
      // First, get the listing to find its category
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('category_id, subcategory_id')
        .eq('id', listingId)
        .single();
      
      if (listingError) throw listingError;
      
      // Handle null category_id
      if (!listing.category_id) {
        return [];
      }
      
      // Fetch similar listings from the same category/subcategory
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!listings_user_id_fkey(id, username, avatar_url),
          media:listing_media(*)
        `)
        .eq('is_active', true)
        .eq('category_id', listing.category_id)
        .neq('id', listingId)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as unknown as Listing[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}
