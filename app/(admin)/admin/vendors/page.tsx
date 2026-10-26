/**
 * Admin Vendors Dashboard Page
 * 
 * This page displays pending vendor applications for admin review and approval.
 * Features:
 * - Server Component with admin authentication guard
 * - Fetch pending vendor applications from database
 * - Display pending count badge
 * - Render grid of VendorApprovalCard components
 * - Show empty state when no pending applications
 * - Filters: sort by date, search by business name
 * - Mobile-first responsive design
 * 
 * Requirements: 4.3
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { requireAdmin } from '@/lib/services/auth';
import { getPendingVendorApplications } from '@/lib/services/database';
import { VendorApprovalCard } from '@/components/admin/vendor-approval-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCheck, Search, Calendar } from 'lucide-react';
import type { VendorApplicationWithUser } from '@/lib/types/core';

// ============================================================================
// Page Metadata
// ============================================================================

export const metadata = {
  title: 'Vendor Applications | Admin Dashboard',
  description: 'Review and approve pending vendor applications',
};

// ============================================================================
// Search and Filter Component (Client Component)
// ============================================================================

function VendorFilters({
  searchParams,
}: {
  searchParams: { search?: string; sort?: string };
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <form action="" method="get">
          <input
            type="search"
            name="search"
            placeholder="Search by business name..."
            defaultValue={searchParams.search || ''}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <form action="" method="get">
          <select
            name="sort"
            defaultValue={searchParams.sort || 'newest'}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            onChange={(e) => e.currentTarget.form?.submit()}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Vendor Applications List Component
// ============================================================================

function VendorApplicationsList({
  applications,
  onApproved,
  onRejected,
}: {
  applications: VendorApplicationWithUser[];
  onApproved?: () => void;
  onRejected?: () => void;
}) {
  if (applications.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Pending Applications</h3>
          <p className="text-muted-foreground text-center max-w-md">
            There are no vendor applications awaiting review at this time.
            New applications will appear here automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {applications.map((application) => (
        <VendorApprovalCard
          key={application.id}
          application={application}
          onApproved={onApproved}
          onRejected={onRejected}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function VendorApplicationsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="w-full animate-pulse">
          <CardHeader>
            <div className="h-6 w-3/4 bg-muted rounded mb-2" />
            <div className="h-4 w-1/2 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: { search?: string; sort?: string };
}) {
  // Authentication guard - require admin role
  try {
    await requireAdmin();
  } catch (error) {
    // Redirect to login if not authenticated or not admin
    redirect('/login?redirect=/admin/vendors');
  }

  // Fetch pending vendor applications
  const applications = await getPendingVendorApplications();

  if (!applications) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-xl font-semibold text-destructive mb-2">
              Failed to Load Applications
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Unable to fetch vendor applications. Please check your connection and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Apply search filter
  let filteredApplications = applications;
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    filteredApplications = applications.filter((app) =>
      app.business_name.toLowerCase().includes(searchLower)
    );
  }

  // Apply sort
  const sortOrder = searchParams.sort || 'newest';
  filteredApplications = [...filteredApplications].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Calculate pending count
  const pendingCount = filteredApplications.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Vendor Applications
            </h1>
            <p className="text-muted-foreground">
              Review and approve vendor applications to grant vendor badges
            </p>
          </div>
          
          {/* Pending Count Badge */}
          {pendingCount > 0 && (
            <Badge variant="default" className="w-fit text-lg px-4 py-2">
              {pendingCount} Pending
            </Badge>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <VendorFilters searchParams={searchParams} />
      </div>

      {/* Applications Grid */}
      <Suspense fallback={<VendorApplicationsLoading />}>
        <VendorApplicationsList applications={filteredApplications} />
      </Suspense>
    </div>
  );
}
