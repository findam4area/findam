/**
 * Admin Dashboard Layout Component
 * 
 * Server Component that provides:
 * - Admin authentication guard for entire route group
 * - Responsive sidebar navigation with pending count badges
 * - Mobile-friendly collapsible navigation
 * 
 * Requirements: 3.2, 4.3
 */

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/services/auth';
import { getPendingListings, getPendingVendorApplications } from '@/lib/services/database';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication guard - requires admin role
  // This will throw and redirect if user is not authenticated or not admin
  try {
    await requireAdmin();
  } catch (error) {
    // User is not authenticated or not an admin
    redirect('/login?error=unauthorized&redirect=/admin');
  }

  // Fetch pending counts for navigation badges
  let pendingListingsCount = 0;
  let pendingVendorsCount = 0;

  try {
    const [pendingListings, pendingVendors] = await Promise.all([
      getPendingListings(),
      getPendingVendorApplications(),
    ]);

    pendingListingsCount = pendingListings?.length || 0;
    pendingVendorsCount = pendingVendors?.length || 0;
  } catch (error) {
    console.error('Error fetching pending counts:', error);
    // Continue with zero counts rather than failing the entire page
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Sidebar - responsive, collapses on mobile */}
      <AdminSidebar
        pendingListingsCount={pendingListingsCount}
        pendingVendorsCount={pendingVendorsCount}
      />

      {/* Main content area with left margin for desktop sidebar */}
      <div className="lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
