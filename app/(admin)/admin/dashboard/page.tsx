"use client";

import { useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    // In a real app, you'd check if they're an admin
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-naija-orange animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <AdminDashboard />
    </div>
  );
}
