/**
 * Query Keys for TanStack Query
 * 
 * Hierarchical query key structure (Requirement 29.2)
 * 
 * Pattern: [entity, scope, ...filters]
 * Examples:
 * - ['listings', 'featured']
 * - ['listings', 'featured', { category: 'electronics' }]
 * - ['listings', 'detail', listingId]
 * - ['vendors', 'featured']
 * - ['vendors', 'detail', vendorId]
 * - ['activities', 'recent']
 * - ['recommendations', userId]
 */

import type { ListingFilters } from "@/lib/types";

export const queryKeys = {
  // Listings
  listings: {
    all: ['listings'] as const,
    featured: () => [...queryKeys.listings.all, 'featured'] as const,
    infinite: (filters?: ListingFilters) => 
      [...queryKeys.listings.all, 'infinite', filters] as const,
    detail: (id: string) => [...queryKeys.listings.all, 'detail', id] as const,
    byCategory: (categoryId: string) => 
      [...queryKeys.listings.all, 'category', categoryId] as const,
    byVendor: (vendorId: string) => 
      [...queryKeys.listings.all, 'vendor', vendorId] as const,
    search: (query: string, filters?: ListingFilters) => 
      [...queryKeys.listings.all, 'search', query, filters] as const,
  },
  
  // Vendors
  vendors: {
    all: ['vendors'] as const,
    featured: () => [...queryKeys.vendors.all, 'featured'] as const,
    detail: (id: string) => [...queryKeys.vendors.all, 'detail', id] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.vendors.all, 'list', filters] as const,
  },
  
  // Activities
  activities: {
    all: ['activities'] as const,
    recent: (limit?: number) => 
      [...queryKeys.activities.all, 'recent', limit] as const,
  },
  
  // Recommendations
  recommendations: {
    all: ['recommendations'] as const,
    forUser: (userId?: string) => 
      [...queryKeys.recommendations.all, 'user', userId] as const,
    trending: () => [...queryKeys.recommendations.all, 'trending'] as const,
  },
  
  // User interactions
  interactions: {
    all: ['interactions'] as const,
    likes: (userId: string) => 
      [...queryKeys.interactions.all, 'likes', userId] as const,
    saves: (userId: string) => 
      [...queryKeys.interactions.all, 'saves', userId] as const,
    recentlyViewed: (userId?: string) => 
      [...queryKeys.interactions.all, 'viewed', userId] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.categories.all, 'detail', id] as const,
  },
  
  // Deals
  deals: {
    all: ['deals'] as const,
    active: () => [...queryKeys.deals.all, 'active'] as const,
  },
} as const;
