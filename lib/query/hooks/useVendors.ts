/**
 * useVendors Hook
 * 
 * TanStack Query hooks for vendor data fetching with prefetching
 * Implements Requirements 29.5, 29.8
 */

import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "../keys";
import type { User } from "@/lib/types";

export interface Vendor extends User {
  listing_count?: number;
  rating?: number;
  review_count?: number;
  response_time_hours?: number;
}

/**
 * Fetch featured vendors
 * Requirement 29.5: Query hooks for data fetching
 */
export function useFeaturedVendors(
  options?: Omit<UseQueryOptions<Vendor[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.vendors.featured(),
    queryFn: async () => {
      const supabase = createClient();
      
      // Fetch vendors with active listings and good ratings
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          listings:listings(count)
        `)
        .eq('is_seller', true)
        .gte('seller_rating', 4.0)
        .order('seller_rating', { ascending: false })
        .limit(12);
      
      if (error) throw error;
      
      // Transform data to include listing count
      return data.map(vendor => ({
        ...vendor,
        listing_count: vendor.listings?.[0]?.count || 0,
        rating: (vendor as any).seller_rating || 0,
        review_count: (vendor as any).seller_reviews_count || 0,
      })) as Vendor[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch single vendor by ID
 */
export function useVendor(
  id: string,
  options?: Omit<UseQueryOptions<Vendor, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          listings:listings(count)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        listing_count: data.listings?.[0]?.count || 0,
        rating: (data as any).seller_rating || 0,
        review_count: (data as any).seller_reviews_count || 0,
      } as Vendor;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Prefetch vendor data
 * Requirement 29.8: Prefetching for anticipated navigation
 * 
 * Use this when hovering over vendor cards or links to preload data
 */
export function usePrefetchVendor() {
  const queryClient = useQueryClient();
  
  return (vendorId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.vendors.detail(vendorId),
      queryFn: async () => {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            listings:listings(count)
          `)
          .eq('id', vendorId)
          .single();
        
        if (error) throw error;
        
        return {
          ...data,
          listing_count: data.listings?.[0]?.count || 0,
          rating: (data as any).seller_rating || 0,
          review_count: (data as any).seller_reviews_count || 0,
        } as Vendor;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Fetch vendors list with filters
 */
export function useVendors(
  filters?: {
    min_rating?: number;
    verified_only?: boolean;
    has_listings?: boolean;
  },
  options?: Omit<UseQueryOptions<Vendor[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.vendors.list(filters),
    queryFn: async () => {
      const supabase = createClient();
      
      let query = supabase
        .from('users')
        .select(`
          *,
          listings:listings(count)
        `)
        .eq('is_seller', true);
      
      // Apply filters
      if (filters?.min_rating) {
        query = query.gte('seller_rating', filters.min_rating);
      }
      if (filters?.verified_only) {
        query = query.eq('phone_verified', true);
      }
      
      query = query.order('seller_rating', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let vendors = data.map(vendor => ({
        ...vendor,
        listing_count: vendor.listings?.[0]?.count || 0,
        rating: (vendor as any).seller_rating || 0,
        review_count: (vendor as any).seller_reviews_count || 0,
      })) as Vendor[];
      
      // Filter vendors with listings if requested
      if (filters?.has_listings) {
        vendors = vendors.filter(v => (v.listing_count || 0) > 0);
      }
      
      return vendors;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
