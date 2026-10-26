"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BarChart3, TrendingUp } from "lucide-react";
import { CategoryAnalyticsDashboard } from "@/components/admin/CategoryAnalyticsDashboard";
import { BusinessAnalyticsDashboard } from "@/components/admin/BusinessAnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Admin Analytics Page
 * Task 23.5: Create admin pages
 * Requirements: 19.1, 20.4, 20.5
 * 
 * This page provides comprehensive analytics dashboards for admins:
 * - Category analytics (top categories, trending, empty categories)
 * - Business analytics (total, verified, premium, completeness)
 * - Distribution charts (by category, by state)
 */
export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    // In a real app, you'd verify admin status from session/JWT
    const checkAuth = async () => {
      try {
        // This would be replaced with actual auth check
        // For now, we'll assume the route is protected by middleware
        setIsAdmin(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive text-lg">Access Denied</p>
          <p className="text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive analytics for categories and businesses
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="business" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Business Analytics
            </TabsTrigger>
            <TabsTrigger value="category" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Category Analytics
            </TabsTrigger>
          </TabsList>

          {/* Business Analytics Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Analytics Overview</CardTitle>
                <CardDescription>
                  Track business registrations, verifications, premium subscriptions, and geographic distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessAnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Analytics Tab */}
          <TabsContent value="category" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Analytics Overview</CardTitle>
                <CardDescription>
                  Monitor category performance, trending categories, and user engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryAnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
