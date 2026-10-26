"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import { CategoryImportForm } from "@/components/admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Admin Categories Import Page
 * Task 23.5: Create admin pages
 * Requirements: 19.1, 19.2
 * 
 * This page provides CSV import functionality for categories:
 * - Upload CSV file with categories
 * - Validate CSV format
 * - Preview categories before import
 * - Display import results
 */
export default function AdminCategoriesImportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    const checkAuth = async () => {
      try {
        // This would be replaced with actual auth check
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
          <div className="flex items-center gap-4">
            <Link href="/admin/categories">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Categories
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Upload className="w-8 h-8" />
                Import Categories
              </h1>
              <p className="text-muted-foreground mt-1">
                Bulk import categories from CSV file
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CategoryImportForm />
        </div>
      </div>
    </div>
  );
}
