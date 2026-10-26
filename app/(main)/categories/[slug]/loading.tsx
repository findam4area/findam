/**
 * CategoryDetailPage Loading State
 * 
 * Displays skeleton loading UI while category data is being fetched.
 * Shows placeholders matching the category detail page layout.
 * 
 * Requirements: 16.23, 16.24, 16.25
 */

export default function CategoryDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Breadcrumb Loading Skeleton */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            {/* Home breadcrumb skeleton */}
            <div className="h-4 w-12 bg-gray-800 rounded animate-pulse" />
            <span className="text-gray-600">/</span>
            
            {/* Browse Categories breadcrumb skeleton */}
            <div className="h-4 w-36 bg-gray-800 rounded animate-pulse" />
            <span className="text-gray-600">/</span>
            
            {/* Current category breadcrumb skeleton */}
            <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Loading */}
      <main className="flex-1">
        {/* Category Header Loading */}
        <header className="bg-gradient-to-br from-gray-900 via-gray-900 to-primary-950/30 border-b border-gray-800">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Category Image Skeleton */}
              <div className="relative w-full md:w-48 h-48 rounded-xl overflow-hidden border border-gray-800 flex-shrink-0">
                <div className="absolute inset-0 bg-gray-800 animate-pulse" />
              </div>

              {/* Category Info Skeleton */}
              <div className="flex-1 space-y-4">
                {/* Category Name Skeleton */}
                <div className="h-10 w-3/4 bg-gray-800 rounded animate-pulse" />

                {/* Description Skeleton */}
                <div className="space-y-2">
                  <div className="h-5 w-full bg-gray-800 rounded animate-pulse" />
                  <div className="h-5 w-5/6 bg-gray-800 rounded animate-pulse" />
                </div>

                {/* Listing Count Skeleton */}
                <div className="h-5 w-48 bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        {/* Subcategories Section Loading */}
        <div className="container mx-auto px-4 py-8">
          {/* Section Header Skeleton */}
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
          </div>

          {/* Subcategory Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden"
              >
                {/* Image skeleton */}
                <div className="aspect-[4/3] bg-gray-800 animate-pulse" />
                
                {/* Content skeleton */}
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-800 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}