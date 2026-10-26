export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="text-center">
        {/* Animated logo/spinner */}
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-neon-green mx-auto" />
          <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border border-neon-green/30 mx-auto" />
        </div>

        {/* Loading text */}
        <div className="space-y-3">
          <div className="animate-pulse h-6 w-32 bg-gray-800/50 rounded mx-auto" />
          <div className="animate-pulse h-4 w-48 bg-gray-800/50 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}
