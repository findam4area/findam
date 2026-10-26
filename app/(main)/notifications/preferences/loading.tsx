export default function NotificationPreferencesLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="animate-pulse h-8 w-64 bg-gray-800/50 rounded-lg mb-6" />

      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="animate-pulse h-5 w-48 bg-gray-800/50 rounded" />
                <div className="animate-pulse h-4 w-64 bg-gray-800/50 rounded" />
              </div>
              <div className="animate-pulse h-6 w-12 bg-gray-800/50 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
