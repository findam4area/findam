/**
 * TanStack Query Hooks and Utilities
 * 
 * Central export for all query hooks, mutations, and utilities
 * Implements Requirements 29.1-29.9
 */

// Query keys
export { queryKeys } from './keys';

// Query hooks
export {
  useFeaturedListings,
  useInfiniteListings,
  useListing,
  useListingsByCategory,
  useListingsByVendor,
} from './hooks/useListings';

export {
  useFeaturedVendors,
  useVendor,
  useVendors,
  usePrefetchVendor,
  type Vendor,
} from './hooks/useVendors';

export {
  useActivities,
  useRealtimeActivities,
  createActivity,
  type Activity,
} from './hooks/useActivities';

export {
  useRecommendations,
  useTrendingListings,
  useSimilarListings,
} from './hooks/useRecommendations';

// Mutation hooks
export {
  useLikeListing,
  useSaveListing,
  useFollowVendor,
  useTrackView,
} from './mutations/useInteractions';

export {
  useCreateListing,
  useUpdateListing,
  useDeleteListing,
  useBoostListing,
} from './mutations/useListingMutations';

export {
  useUpdateVendorProfile,
  useVerifyVendorPhone,
  useUpdateVendorRating,
} from './mutations/useVendorMutations';
