export default function CreateListingLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="animate-pulse h-8 w-48 bg-gray-800/50 rounded-lg mb-6" />

      {/* Progress indicator skeleton */}
      <div className="flex justify-between mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="animate-pulse w-10 h-10 bg-gray-800/50 rounded-full" />
            {i < 4 && (
              <div className="animate-pulse h-1 w-16 bg-gray-800/50 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Form skeleton */}
      <div className="glass-card p-6 rounded-xl space-y-6">
        <div className="space-y-2">
          <div className="animate-pulse h-4 w-24 bg-gray-800/50 rounded" />
          <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />
        </div>

        <div className="space-y-2">
          <div className="animate-pulse h-4 w-24 bg-gray-800/50 rounded" />
          <div className="animate-pulse h-32 w-full bg-gray-800/50 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="animate-pulse h-4 w-24 bg-gray-800/50 rounded" />
            <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="animate-pulse h-4 w-24 bg-gray-800/50 rounded" />
            <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
