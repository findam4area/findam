import { NotificationListSkeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="animate-pulse h-8 w-48 bg-gray-800/50 rounded-lg mb-6" />
      <NotificationListSkeleton />
    </div>
  );
}
