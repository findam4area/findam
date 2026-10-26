import { NotificationPreferences } from "@/components/notifications";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function PreferencesLoadingSkeleton() {
  return (
    <div className="glass-card p-6 rounded-xl space-y-6">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-4 border-b border-dark-border last:border-0"
        >
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function NotificationPreferencesPage() {
  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-white">
            Notification Settings
          </h1>
          <p className="text-gray-400 mt-2">
            Manage how you receive notifications from FindAm
          </p>
        </div>

        {/* Preferences Component */}
        <Suspense fallback={<PreferencesLoadingSkeleton />}>
          <NotificationPreferences />
        </Suspense>
      </div>
    </div>
  );
}
