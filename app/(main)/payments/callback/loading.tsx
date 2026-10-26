export default function PaymentCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neon-green mx-auto mb-4" />
        <div className="animate-pulse h-6 w-64 bg-gray-800/50 rounded mx-auto mb-2" />
        <div className="animate-pulse h-4 w-48 bg-gray-800/50 rounded mx-auto" />
      </div>
    </div>
  );
}
