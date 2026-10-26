export default function InventoryLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
