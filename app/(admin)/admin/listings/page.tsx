/**
 * Admin Listings Dashboard Page
 * 
 * Server Component that displays pending listings for admin approval.
 * Provides comprehensive listing management with search, filter, and sort capabilities.
 * 
 * Features:
 * - Admin authentication guard (redirects non-admins)
 * - Fetch and display pending listings
 * - Pending count badge
 * - Search by title/user
 * - Sort by date (newest/oldest first)
 * - Grid of ListingApprovalCard components
 * - Empty state handling
 * - Mobile-first responsive design
 * 
 * Requirements: 3.2, 3.3
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AlertCircle, CheckCircle, Search } from 'lucide-react';
import { isAdmin } from '@/lib/services/auth';
import { getPendingListings } from '@/lib/services/database';
import { ListingApprovalCard } from '@/components/admin/listing-approval-card';
import { ListingsFilters } from './listings-filters';
import type { ListingWithRelations } from '@/lib/types/core';

/**
 * Page metadata for SEO
 */
export const metadata = {
  title: 'Pending Listings - Admin Dashboard | FindAm',
  description: 'Review and approve pending listings',
  robots: 'noindex, nofollow', // Don't index admin pages
};

/**
 * Search parameters interface for type safety
 */
interface SearchParams {
  search?: string;
  sort?: 'newest' | 'oldest';
}

/**
 * Props interface
 */
interface AdminListingsPageProps {
  searchParams: SearchParams;
}

/**
 * Filter listings by search query (title or user name)
 */
function filterListings(
  listings: ListingWithRelations[],
  searchQuery?: string
): ListingWithRelations[] {
  if (!searchQuery || searchQuery.trim() === '') {
    return listings;
  }

  const query = searchQuery.toLowerCase().trim();

  return listings.filter((listing) => {
    const titleMatch = listing.title.toLowerCase().includes(query);
    const userMatch =
      listing.user.username?.toLowerCase().includes(query) ||
      listing.user.email.toLowerCase().includes(query);

    return titleMatch || userMatch;
  });
}

/**
 * Sort listings by date
 */
function sortListings(
  listings: ListingWithRelations[],
  sortOrder: 'newest' | 'oldest' = 'newest'
): ListingWithRelations[] {
  return [...listings].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();

    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Admin Listings Dashboard Page Component
 * 
 * Main page component that:
 * 1. Checks admin authentication
 * 2. Fetches pending listings
 * 3. Applies search and sort filters
 * 4. Displays listings in responsive grid
 * 5. Shows empty states appropriately
 * 
 * @param searchParams - URL search parameters for filtering and sorting
 */
export default async function AdminListingsPage({
  searchParams,
}: AdminListingsPageProps) {
  // Admin authentication guard (Requirement 3.2)
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect('/login');
  }

  // Fetch pending listings (Requirement 3.3)
  const pendingListings = await getPendingListings();

  // Handle fetch error
  if (pendingListings === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Error Loading Listings
            </h2>
            <p className="text-gray-400 mb-4">
              Unable to fetch pending listings. Please check your connection and
              try again.
            </p>
            <a
              href="/admin/listings"
              className="inline-block px-4 py-2 bg-naija-green text-white rounded-lg hover:bg-naija-green/90 transition-colors"
            >
              Retry
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Apply filters and sorting
  const searchQuery = searchParams.search;
  const sortOrder = searchParams.sort || 'newest';

  let filteredListings = filterListings(pendingListings, searchQuery);
  filteredListings = sortListings(filteredListings, sortOrder);

  const totalPending = pendingListings.length;
  const filteredCount = filteredListings.length;

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Pending Listings
              </h1>
              <p className="text-gray-400">
                Review and approve user-submitted listings
              </p>
            </div>

            {/* Pending count badge (Requirement 3.3) */}
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-white font-semibold">
                {totalPending} Pending
              </span>
            </div>
          </div>

          {/* Filters (Requirement 3.3) - Client component for better UX */}
          <ListingsFilters
            totalPending={totalPending}
            filteredCount={filteredCount}
          />
        </div>

        {/* Listings grid (Requirement 3.3) */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-naija-green mx-auto mb-4"></div>
                <p className="text-gray-400">Loading listings...</p>
              </div>
            </div>
          }
        >
          {filteredListings.length === 0 ? (
            // Empty state (Requirement 3.3)
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                {searchQuery ? (
                  <>
                    <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">
                      No listings found
                    </h2>
                    <p className="text-gray-400 mb-4">
                      No pending listings match your search criteria. Try
                      adjusting your filters.
                    </p>
                    <a
                      href="/admin/listings"
                      className="inline-block px-4 py-2 bg-naija-green text-white rounded-lg hover:bg-naija-green/90 transition-colors"
                    >
                      Clear filters
                    </a>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">
                      All caught up!
                    </h2>
                    <p className="text-gray-400 mb-4">
                      There are no pending listings to review at the moment.
                      Check back later or explore other admin functions.
                    </p>
                    <a
                      href="/admin/dashboard"
                      className="inline-block px-4 py-2 bg-naija-green text-white rounded-lg hover:bg-naija-green/90 transition-colors"
                    >
                      Go to Dashboard
                    </a>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Listings grid - mobile-first responsive design (Requirement 3.3)
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <ListingApprovalCard
                  key={listing.id}
                  listing={listing}
                  onActionComplete={() => {
                    // Refresh the page to show updated listings
                    // In a real implementation, this would be handled by revalidation
                    if (typeof window !== 'undefined') {
                      window.location.reload();
                    }
                  }}
                />
              ))}
            </div>
          )}
        </Suspense>

        {/* Stats footer */}
        {filteredListings.length > 0 && (
          <div className="mt-8 pt-6 border-t border-dark-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-400">
              <div>
                Displaying {filteredListings.length} listing
                {filteredListings.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
              <div className="flex items-center gap-2">
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.reload();
                    }
                  }}
                  className="text-naija-green hover:text-naija-green/80 underline"
                  aria-label="Refresh listings"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
