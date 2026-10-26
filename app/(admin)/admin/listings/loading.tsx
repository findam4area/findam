import { Skeleton } from '@/components/ui/skeleton';

export default function AdminListingsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Listings Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl overflow-hidden">
            {/* Image skeleton */}
            <Skeleton className="w-full aspect-[4/3]" />

            <div className="p-4 space-y-3">
              {/* Title and status */}
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              {/* Price and location */}
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2" />

              {/* User info */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex justify-center gap-2 pt-6">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}
