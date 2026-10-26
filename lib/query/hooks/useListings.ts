/**
 * useListings Hook
 * 
 * TanStack Query hooks for listings data fetching
 * Implements Requirements 29.5, 29.8
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "../keys";
import type { Listing, ListingFilters } from "@/lib/types";

const LISTINGS_PER_PAGE = 12;

/**
 * Fetch featured listings
 * Requirement 29.5: Query hooks for data fetching
 */
export function useFeaturedListings(
  options?: Omit<UseQueryOptions<Listing[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.listings.featured(),
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!listings_user_id_fkey(id, username, avatar_url),
          media:listing_media(*)
        `)
        .eq('is_active', true)
        .eq('is_boosted', true)
        .order('boost_expires_at', { ascending: false })
        .limit(12);
      
      if (error) throw error;
      return data as unknown as Listing[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (Requirement 29.3)
    ...options,
  });
}

/**
 * Fetch listings with infinite scroll pagination
 * Requirement 29.5: Infinite query for pagination
 */
export function useInfiniteListings(
  filters?: ListingFilters,
  options?: Omit<UseInfiniteQueryOptions<Listing[], Error, Listing[], readonly unknown[], number>, 'queryKey' | 'queryFn'>
) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.infinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const supabase = createClient();
      
      let query = supabase
        .from('listings')
        .select(`
          *,
          user:users!listings_user_id_fkey(id, username, avatar_url),
          media:listing_media(*)
        `)
        .eq('is_active', true);
      
      // Apply filters
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.subcategory_id) {
        query = query.eq('subcategory_id', filters.subcategory_id);
      }
      if (filters?.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters?.max_price) {
        query = query.lte('price', filters.max_price);
      }
      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }
      if (filters?.lga) {
        query = query.eq('lga', filters.lga);
      }
      
      // Apply sorting
      switch (filters?.sort_by) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'date_asc':
          query = query.order('created_at', { ascending: true });
          break;
        case 'date_desc':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }
      
      // Apply pagination
      const from = pageParam * LISTINGS_PER_PAGE;
      const to = from + LISTINGS_PER_PAGE - 1;
      query = query.range(from, to);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as Listing[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the page size, we've reached the end
      if (lastPage.length < LISTINGS_PER_PAGE) return undefined;
      return allPages.length;
    },
    ...options,
  });
}

/**
 * Fetch single listing by ID
 */
export function useListing(
  id: string,
  options?: Omit<UseQueryOptions<Listing, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!listings_user_id_fkey(id, username, avatar_url),
          media:listing_media(*),
          category:categories(*),
          subcategory:subcategories(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as unknown as Listing;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetch listings by category
 */
export function useListingsByCategory(
  categoryId: string,
  options?: Omit<UseQueryOptions<Listing[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.listings.byCategory(categoryId),
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!listings_user_id_fkey(id, username, avatar_url),
          media:listing_media(*)
        `)
        .eq('is_active', true)
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as unknown as Listing[];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetch listings by vendor
 */
export function useListingsByVendor(
  vendorId: string,
  options?: Omit<UseQueryOptions<Listing[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.listings.byVendor(vendorId),
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          media:listing_media(*)
        `)
        .eq('is_active', true)
        .eq('user_id', vendorId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Listing[];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
