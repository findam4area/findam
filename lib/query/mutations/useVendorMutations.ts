/**
 * Vendor Mutations
 * 
 * TanStack Query mutations for vendor profile operations with query invalidation
 * Implements Requirement 29.6 (query invalidation on mutations)
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "../keys";
import type { User } from "@/lib/types";

interface UpdateVendorProfileInput {
  id: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  is_seller?: boolean;
}

/**
 * Update vendor profile
 * Requirement 29.6: Invalidate vendor queries on profile update
 */
export function useUpdateVendorProfile() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<User, Error, UpdateVendorProfileInput>({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as User;
    },
    
    // Invalidate relevant queries on success (Requirement 29.6)
    onSuccess: (data) => {
      // Invalidate the specific vendor
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.vendors.detail(data.id) 
      });
      
      // Invalidate all vendors queries
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
      
      // Invalidate featured vendors if seller
      if ((data as any).is_seller) {
        queryClient.invalidateQueries({ queryKey: queryKeys.vendors.featured() });
      }
      
      // Invalidate vendor's listings (they include vendor info)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.listings.byVendor(data.id) 
      });
    },
  });
}

/**
 * Verify vendor phone
 * Requirement 29.6: Invalidate vendor queries on verification
 */
export function useVerifyVendorPhone() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<User, Error, { id: string; phone: string }>({
    mutationFn: async ({ id, phone }) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          phone,
          phone_verified: true,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as User;
    },
    
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.vendors.detail(data.id) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

/**
 * Update vendor rating
 * This is typically called after a review is submitted
 */
export function useUpdateVendorRating() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  return useMutation<void, Error, { vendorId: string }>({
    mutationFn: async ({ vendorId }) => {
      // Calculate new average rating from reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_user_id', vendorId);
      
      if (reviewsError) throw reviewsError;
      
      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length;
        
        const { error } = await supabase
          .from('users')
          .update({
            trust_score: Math.round(avgRating * 20), // Convert 5-star to 100-point scale
          } as any) // Use type assertion since seller_rating doesn't exist in schema
          .eq('id', vendorId);
        
        if (error) throw error;
      }
    },
    
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.vendors.detail(variables.vendorId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}
