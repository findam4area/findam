/**
 * Skeleton loading components
 * Used to show loading states while content is being fetched
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-800/50", className)}
      {...props}
    />
  );
}

/**
 * Skeleton for listing cards
 */
export function ListingCardSkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-[4/3]" />

      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-3/4" />

        {/* Price skeleton */}
        <Skeleton className="h-5 w-1/3" />

        {/* Location skeleton */}
        <Skeleton className="h-4 w-1/2" />

        {/* User info skeleton */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for profile header
 */
export function ProfileHeaderSkeleton() {
  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-start gap-6">
        {/* Avatar skeleton */}
        <Skeleton className="w-32 h-32 rounded-full" />

        <div className="flex-1 space-y-4">
          {/* Username skeleton */}
          <Skeleton className="h-8 w-48" />

          {/* Bio skeleton */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />

          {/* Stats skeleton */}
          <div className="flex gap-6 pt-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for message list
 */
export function MessageListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for search results
 */
export function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for story rings
 */
export function StoryRingSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for feed container
 */
export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for category grid
 */
export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="glass-card p-6 rounded-xl">
          <Skeleton className="w-12 h-12 mx-auto mb-3" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for notification list
 */
export function NotificationListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="glass-card p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for listing detail page
 */
export function ListingDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Image gallery skeleton */}
      <Skeleton className="w-full aspect-video rounded-xl" />

      {/* Title and price skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
      </div>

      {/* Details skeleton */}
      <div className="glass-card p-6 rounded-xl space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Seller info skeleton */}
      <div className="glass-card p-6 rounded-xl">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for category cards
 */
export function CategoryCardSkeleton() {
  return (
    <div className="glass-card p-6 rounded-xl">
      <Skeleton className="w-12 h-12 mx-auto mb-3" />
      <Skeleton className="h-4 w-24 mx-auto mb-2" />
      <Skeleton className="h-3 w-16 mx-auto" />
    </div>
  );
}

/**
 * Skeleton for admin dashboard
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-xl">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="glass-card p-6 rounded-xl">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Table skeleton */}
      <div className="glass-card p-6 rounded-xl">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
