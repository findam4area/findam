export default function AnalyticsLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="animate-pulse h-8 w-48 bg-gray-800/50 rounded-lg mb-6" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-xl">
            <div className="animate-pulse h-4 w-24 bg-gray-800/50 rounded mb-3" />
            <div className="animate-pulse h-8 w-32 bg-gray-800/50 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="glass-card p-6 rounded-xl mb-6">
        <div className="animate-pulse h-6 w-48 bg-gray-800/50 rounded mb-6" />
        <div className="animate-pulse h-64 w-full bg-gray-800/50 rounded" />
      </div>

      {/* Listings table skeleton */}
      <div className="glass-card p-6 rounded-xl">
        <div className="animate-pulse h-6 w-48 bg-gray-800/50 rounded mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-16 w-full bg-gray-800/50 rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
