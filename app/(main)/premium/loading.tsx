export default function PremiumLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Hero section skeleton */}
      <div className="text-center mb-12">
        <div className="animate-pulse h-12 w-96 bg-gray-800/50 rounded-lg mx-auto mb-4" />
        <div className="animate-pulse h-6 w-64 bg-gray-800/50 rounded mx-auto" />
      </div>

      {/* Pricing cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass-card p-8 rounded-xl">
            <div className="animate-pulse h-8 w-32 bg-gray-800/50 rounded mb-4" />
            <div className="animate-pulse h-12 w-48 bg-gray-800/50 rounded mb-6" />
            <div className="space-y-3 mb-8">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="animate-pulse w-5 h-5 bg-gray-800/50 rounded-full" />
                  <div className="animate-pulse h-4 w-48 bg-gray-800/50 rounded" />
                </div>
              ))}
            </div>
            <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Features section skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-xl">
            <div className="animate-pulse w-12 h-12 bg-gray-800/50 rounded-lg mb-4" />
            <div className="animate-pulse h-5 w-32 bg-gray-800/50 rounded mb-2" />
            <div className="animate-pulse h-4 w-full bg-gray-800/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
