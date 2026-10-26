/**
 * Example usage of ListingApprovalCard component
 * 
 * This file demonstrates how to use the ListingApprovalCard component
 * in an admin dashboard page.
 */

import { ListingApprovalCard } from './listing-approval-card';
import type { Listing } from '@/lib/types/core';

// Example usage in an admin page component
export function AdminListingsPage() {
  // Fetch pending listings from your data source
  const pendingListings: Array<Listing & {
    user: {
      username?: string;
      full_name: string;
      email: string;
    };
    category: {
      name: string;
    };
  }> = []; // Your fetched data here

  const handleActionComplete = () => {
    // Refresh the listings after an action completes
    // This could trigger a refetch or router refresh
    console.log('Action completed, refreshing listings...');
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Pending Listings Approval
      </h1>

      {pendingListings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No pending listings to review
        </div>
      ) : (
        <div className="space-y-4">
          {pendingListings.map((listing) => (
            <ListingApprovalCard
              key={listing.id}
              listing={listing}
              onActionComplete={handleActionComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Server Component example for Next.js App Router
 */
export async function AdminListingsServerPage() {
  // Fetch pending listings server-side
  // const listings = await fetchPendingListings();

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Pending Listings Approval
      </h1>

      {/* Map over listings and render ListingApprovalCard */}
      {/* Each card will be a Client Component with interactive approve/reject */}
    </div>
  );
}
