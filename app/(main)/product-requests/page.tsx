"use client";

/**
 * Product Requests Page
 *
 * Main page for product requests feature where buyers can create requests
 * and sellers can browse and submit offers.
 *
 * Requirements: 19.1, 19.2, 19.8, 19.10
 */

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductRequestForm, RequestsFeed } from "@/components/product-request";
import { Plus, Search, Package, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProductRequestsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "my-requests">(
    "browse",
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRequestCreated = (requestId: string) => {
    setShowCreateForm(false);
    router.push(`/product-requests/${requestId}`);
  };

  const handleRequestClick = (requestId: string) => {
    router.push(`/product-requests/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Product Requests</h1>
            <p className="text-muted-foreground">
              Post what you&apos;re looking for or browse requests to submit offers
            </p>
          </div>
          {user && !showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Request
            </Button>
          )}
        </div>

        {/* Guest Banner */}
        {!user && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold mb-1">
                  Sign in to create requests
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create an account to post product requests and receive offers
                  from sellers
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/register">
                  <Button>Create Account</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Create Request Form */}
        {user && showCreateForm && (
          <ProductRequestForm
            onSuccess={handleRequestCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Tabs */}
        {user && !showCreateForm && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Browse Requests
              </TabsTrigger>
              <TabsTrigger
                value="my-requests"
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                My Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-6">
              <RequestsFeed onRequestClick={handleRequestClick} />
            </TabsContent>

            <TabsContent value="my-requests" className="mt-6">
              <div className="text-center text-muted-foreground py-12">
                My Requests view - Coming soon
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Public Feed (for guests) */}
        {!user && <RequestsFeed onRequestClick={handleRequestClick} />}
      </div>
    </div>
  );
}
