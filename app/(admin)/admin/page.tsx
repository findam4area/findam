/**
 * Admin Dashboard Home Page
 * 
 * Server Component that displays the main admin dashboard with:
 * - Summary cards: Total Listings, Pending Listings, Total Vendors, Pending Vendors, Total Users
 * - Recent activity: Latest listings and vendor applications
 * - Quick action buttons: Review Listings, Review Vendors
 * - Mobile-first card layout
 * 
 * Requirements: 3.2, 4.3
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutList, 
  Clock, 
  Store, 
  Users, 
  ArrowRight,
  AlertCircle,
  TrendingUp,
  FileText,
  Building2
} from 'lucide-react';
import { requireAdmin } from '@/lib/services/auth';
import { 
  getDashboardStats, 
  getRecentListings, 
  getRecentVendorApplications 
} from '@/lib/services/database';
import type { ListingWithRelations, VendorApplicationWithUser } from '@/lib/types/core';

/**
 * Page metadata for SEO
 */
export const metadata = {
  title: 'Admin Dashboard | FindAm',
  description: 'Admin dashboard for managing listings, vendors, and users',
  robots: 'noindex, nofollow', // Don't index admin pages
};

/**
 * Summary Card Component
 * Displays a metric with icon, label, and value
 */
function SummaryCard({
  icon: Icon,
  label,
  value,
  trend,
  iconColor,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  trend?: string;
  iconColor: string;
  href?: string;
}) {
  const CardContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-opacity-10 ${iconColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-green-500">
            <TrendingUp className="h-3 w-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block p-6 bg-dark-card border border-dark-border rounded-lg hover:border-naija-green transition-colors"
      >
        {CardContent}
      </Link>
    );
  }

  return (
    <div className="p-6 bg-dark-card border border-dark-border rounded-lg">
      {CardContent}
    </div>
  );
}

/**
 * Recent Listing Item Component
 */
function RecentListingItem({ listing }: { listing: ListingWithRelations }) {
  const statusColors = {
    pending: 'text-yellow-500 bg-yellow-500/10',
    approved: 'text-green-500 bg-green-500/10',
    rejected: 'text-red-500 bg-red-500/10',
  };

  const statusColor = statusColors[listing.status];

  return (
    <div className="flex items-start gap-4 p-4 bg-dark-card border border-dark-border rounded-lg hover:border-naija-green/50 transition-colors">
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-800 relative">
        {listing.images && listing.images.length > 0 ? (
          <Image
            src={listing.images[listing.primary_image_index || 0]}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="h-6 w-6 text-gray-600" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-medium text-white truncate">
            {listing.title}
          </h4>
          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${statusColor}`}>
            {listing.status}
          </span>
        </div>
        
        <p className="text-xs text-gray-400 mb-2">
          {listing.category.name} • {listing.user.username || listing.user.email}
        </p>
        
        <p className="text-xs text-gray-500">
          {new Date(listing.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

/**
 * Recent Vendor Application Item Component
 */
function RecentVendorItem({ application }: { application: VendorApplicationWithUser }) {
  const statusColors = {
    pending: 'text-yellow-500 bg-yellow-500/10',
    approved: 'text-green-500 bg-green-500/10',
    rejected: 'text-red-500 bg-red-500/10',
  };

  const statusColor = statusColors[application.status];

  return (
    <div className="flex items-start gap-4 p-4 bg-dark-card border border-dark-border rounded-lg hover:border-naija-green/50 transition-colors">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
        <Building2 className="h-6 w-6 text-gray-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-medium text-white truncate">
            {application.business_name}
          </h4>
          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${statusColor}`}>
            {application.status}
          </span>
        </div>
        
        <p className="text-xs text-gray-400 mb-2">
          {application.user.full_name || application.user.username || application.user.email}
        </p>
        
        <p className="text-xs text-gray-500">
          {new Date(application.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

/**
 * Admin Dashboard Home Page Component
 * 
 * Main dashboard page that:
 * 1. Checks admin authentication
 * 2. Fetches dashboard statistics
 * 3. Fetches recent activity
 * 4. Displays summary cards
 * 5. Shows recent listings and vendor applications
 * 6. Provides quick action buttons
 * 
 * Requirements: 3.2, 4.3
 */
export default async function AdminDashboardPage() {
  // Admin authentication guard (Requirement 3.2, 4.3)
  try {
    await requireAdmin();
  } catch (error) {
    // User is not authenticated or not an admin
    redirect('/login?error=unauthorized&redirect=/admin');
  }

  // Fetch dashboard data in parallel
  const [stats, recentListings, recentVendorApplications] = await Promise.all([
    getDashboardStats(),
    getRecentListings(5),
    getRecentVendorApplications(5),
  ]);

  // Handle fetch errors
  if (stats === null) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-400 mb-4">
            Unable to fetch dashboard data. Please check your connection and try again.
          </p>
          <Link
            href="/admin"
            className="inline-block px-4 py-2 bg-naija-green text-white rounded-lg hover:bg-naija-green/90 transition-colors"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Overview of platform activity and pending approvals
          </p>
        </div>

        {/* Summary Cards - Mobile-first responsive grid (Requirement 3.2, 4.3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <SummaryCard
            icon={LayoutList}
            label="Total Listings"
            value={stats.totalListings}
            iconColor="text-blue-500"
            href="/admin/listings"
          />
          
          <SummaryCard
            icon={Clock}
            label="Pending Listings"
            value={stats.pendingListings}
            iconColor="text-yellow-500"
            href="/admin/listings"
          />
          
          <SummaryCard
            icon={Store}
            label="Total Vendors"
            value={stats.totalVendors}
            iconColor="text-purple-500"
            href="/admin/vendors"
          />
          
          <SummaryCard
            icon={Clock}
            label="Pending Vendors"
            value={stats.pendingVendors}
            iconColor="text-orange-500"
            href="/admin/vendors"
          />
          
          <SummaryCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            iconColor="text-green-500"
          />
        </div>

        {/* Quick Actions - Mobile-first responsive (Requirement 3.2, 4.3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin/listings"
            className="p-6 bg-dark-card border border-dark-border rounded-lg hover:border-naija-green transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <LayoutList className="h-5 w-5 text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Review Listings</h3>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-naija-green transition-colors" />
            </div>
            <p className="text-sm text-gray-400">
              {stats.pendingListings > 0
                ? `${stats.pendingListings} listing${stats.pendingListings !== 1 ? 's' : ''} awaiting review`
                : 'No pending listings'}
            </p>
          </Link>

          <Link
            href="/admin/vendors"
            className="p-6 bg-dark-card border border-dark-border rounded-lg hover:border-naija-green transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Store className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Review Vendors</h3>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-naija-green transition-colors" />
            </div>
            <p className="text-sm text-gray-400">
              {stats.pendingVendors > 0
                ? `${stats.pendingVendors} application${stats.pendingVendors !== 1 ? 's' : ''} awaiting review`
                : 'No pending applications'}
            </p>
          </Link>
        </div>

        {/* Recent Activity - Mobile-first responsive grid (Requirement 3.2, 4.3) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Listings */}
          <div className="bg-dark-card/50 border border-dark-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Listings</h2>
              <Link
                href="/admin/listings"
                className="text-sm text-naija-green hover:text-naija-green/80 transition-colors"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentListings && recentListings.length > 0 ? (
                recentListings.map((listing) => (
                  <RecentListingItem key={listing.id} listing={listing} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p>No recent listings</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Vendor Applications */}
          <div className="bg-dark-card/50 border border-dark-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Vendor Applications</h2>
              <Link
                href="/admin/vendors"
                className="text-sm text-naija-green hover:text-naija-green/80 transition-colors"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentVendorApplications && recentVendorApplications.length > 0 ? (
                recentVendorApplications.map((application) => (
                  <RecentVendorItem key={application.id} application={application} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p>No recent applications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
