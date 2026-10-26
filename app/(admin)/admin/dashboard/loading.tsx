import { AdminDashboardSkeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="animate-pulse h-10 w-64 bg-gray-800/50 rounded-lg mb-8" />
      <AdminDashboardSkeleton />
    </div>
  );
}
