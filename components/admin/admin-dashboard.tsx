"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsCards } from "./metrics-cards";
import { ModerationQueue } from "./moderation-queue";
import { UserManagement } from "./user-management";
import { AnalyticsView } from "./analytics-view";
import type { AdminStats } from "@/lib/types";

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="text-white">Loading stats...</div>
      ) : (
        <MetricsCards stats={stats} />
      )}

      <Tabs defaultValue="ai-moderation" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-dark-card">
          <TabsTrigger value="ai-moderation">AI Moderation</TabsTrigger>
          <TabsTrigger value="reports">User Reports</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-moderation" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">
              AI Content Moderation Queue
            </h2>
            <p className="text-sm text-gray-400">
              Review listings flagged by AI for potential policy violations
            </p>
          </div>
          <ModerationQueue mode="ai-moderation" />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">
              User Reports
            </h2>
            <p className="text-sm text-gray-400">
              Review listings reported by users
            </p>
          </div>
          <ModerationQueue mode="reports" />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
