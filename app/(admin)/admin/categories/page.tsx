"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Settings, Upload } from "lucide-react";
import { CategoryManagementTable } from "@/components/admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Admin Categories Management Page
 * Task 23.5: Create admin pages
 * Requirements: 19.1, 20.4, 20.5
 * 
 * This page provides category management functionality for admins:
 * - Display all categories in hierarchical table
 * - Reorder categories
 * - Hide/unhide categories
 * - Merge categories
 * - Link to import page
 */
export default function AdminCategoriesPage() {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="w-8 h-8" />
                Category Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage category hierarchy, display order, and visibility
              </p>
            </div>
            <Link href="/admin/categories/import">
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Import Categories
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <CategoryManagementTable />
      </div>
    </div>
  );
}
