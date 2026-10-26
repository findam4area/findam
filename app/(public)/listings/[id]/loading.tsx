/**
 * Loading state for Listing Detail Page
 * 
 * Displays skeleton loaders while the listing data is being fetched.
 * Provides visual feedback and improves perceived performance.
 */

export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="space-y-4">
            {/* Main image skeleton */}
            <div className="w-full aspect-[4/3] bg-gray-800 rounded-lg" />
            
            {/* Thumbnail strip skeleton */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-800 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Right Column: Details Skeleton */}
          <div className="space-y-6">
            {/* Title skeleton */}
            <div className="space-y-3">
              <div className="h-10 bg-gray-800 rounded-lg w-3/4" />
              <div className="h-12 bg-gray-800 rounded-lg w-1/2" />
              <div className="flex gap-3">
                <div className="h-8 bg-gray-800 rounded-full w-24" />
                <div className="h-8 bg-gray-800 rounded-full w-32" />
              </div>
            </div>

            {/* Contact buttons skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-800 rounded-lg" />
              ))}
            </div>

            {/* Info card skeleton */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-5 bg-gray-700 rounded w-24" />
                  <div className="h-5 bg-gray-700 rounded w-32" />
                </div>
              ))}
            </div>

            {/* Description skeleton */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-3">
              <div className="h-6 bg-gray-700 rounded w-32" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-700 rounded w-3/4" />
              </div>
            </div>

            {/* Seller info skeleton */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="h-6 bg-gray-700 rounded w-40 mb-4" />
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-700 rounded w-32" />
                  <div className="h-4 bg-gray-700 rounded w-48" />
                </div>
              </div>
            </div>

            {/* Report button skeleton */}
            <div className="h-12 bg-gray-800 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
