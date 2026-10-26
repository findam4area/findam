/**
 * Loading State for Browse Page
 * 
 * Displays skeleton loading UI while listings and filters are being fetched
 */

export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Skeleton */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="h-10 w-64 bg-gray-800 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
          {/* Filters Skeleton */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <div className="h-6 w-24 bg-gray-800 rounded animate-pulse" />
              
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-800 rounded-lg animate-pulse" />
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-800">
                <div className="h-10 w-full bg-gray-800 rounded-lg animate-pulse" />
              </div>
            </div>
          </aside>

          {/* Listings Grid Skeleton */}
          <main>
            <div className="mb-6">
              <div className="h-5 w-48 bg-gray-800 rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  {/* Image skeleton */}
                  <div className="aspect-[4/3] bg-gray-800 animate-pulse" />
                  
                  {/* Content skeleton */}
                  <div className="p-4 space-y-3">
                    <div className="h-6 w-3/4 bg-gray-800 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse" />
                    <div className="h-6 w-24 bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
