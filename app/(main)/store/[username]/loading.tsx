export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Skeleton */}
      <div className="h-48 w-full animate-pulse bg-gray-200 md:h-64" />

      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header Skeleton */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="h-24 w-24 animate-pulse rounded-full bg-gray-200 md:h-32 md:w-32" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-white shadow-sm"
            />
          ))}
        </div>

        {/* Listings Skeleton */}
        <div className="mb-8">
          <div className="mb-4 h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg bg-white shadow-sm"
              >
                <div className="aspect-square animate-pulse bg-gray-200" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
