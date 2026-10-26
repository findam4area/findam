import { SearchResultsSkeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      {/* Search bar skeleton */}
      <div className="glass-card p-4 rounded-xl">
        <div className="animate-pulse h-12 bg-gray-800/50 rounded-lg" />
      </div>

      {/* Filter panel skeleton */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex gap-2 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-8 w-24 bg-gray-800/50 rounded-full flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Results skeleton */}
      <SearchResultsSkeleton />
    </div>
  );
}
