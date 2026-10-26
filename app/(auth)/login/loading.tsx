export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 rounded-xl w-full max-w-md">
        <div className="animate-pulse h-8 w-32 bg-gray-800/50 rounded-lg mb-6 mx-auto" />

        <div className="space-y-4">
          {/* Email field skeleton */}
          <div className="space-y-2">
            <div className="animate-pulse h-4 w-16 bg-gray-800/50 rounded" />
            <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />
          </div>

          {/* Password field skeleton */}
          <div className="space-y-2">
            <div className="animate-pulse h-4 w-20 bg-gray-800/50 rounded" />
            <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />
          </div>

          {/* Submit button skeleton */}
          <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />

          {/* Divider skeleton */}
          <div className="flex items-center gap-4 my-6">
            <div className="animate-pulse h-px flex-1 bg-gray-800/50" />
            <div className="animate-pulse h-4 w-8 bg-gray-800/50 rounded" />
            <div className="animate-pulse h-px flex-1 bg-gray-800/50" />
          </div>

          {/* OAuth buttons skeleton */}
          <div className="space-y-3">
            <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />
            <div className="animate-pulse h-12 w-full bg-gray-800/50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
