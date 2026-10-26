/**
 * MyListings Page (Server Component)
 * 
 * Displays the current user's own listings with:
 * - Status indicators (Pending, Approved, Rejected)
 * - Rejection reasons for rejected listings
 * - Edit and Delete buttons for each listing
 * - Create New Listing button
 * - Empty state for no listings
 * - Mobile-first responsive layout
 * 
 * Requirements: 3.2
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuth } from "@/lib/services/auth";
import { getUserListings } from "@/lib/services/database";
import { Button } from "@/components/ui/button";
import { MyListingsGrid } from "./my-listings-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Listings | FindAm",
  description: "Manage your listings on FindAm",
};

export default async function MyListingsPage() {
  // Require authentication - redirect to login if not authenticated
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    redirect("/login");
  }

  // Fetch user's listings
  const listings = await getUserListings(user.id);

  // Handle error fetching listings
  if (listings === null) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Listings</h1>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
              <p className="text-red-400">Failed to load your listings. Please try again later.</p>
              <Button asChild className="mt-4">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                My Listings
              </h1>
              <p className="text-gray-400 mt-2">
                Manage your listings and track their approval status
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href="/listings/create">
                <Plus className="h-5 w-5 mr-2" />
                Create New Listing
              </Link>
            </Button>
          </div>

          {/* Empty State */}
          {listings.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="h-10 w-10 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">No listings yet</h2>
                <p className="text-gray-400 mb-6">
                  Create your first listing to start showcasing your services or products to thousands of potential customers.
                </p>
                <Button asChild size="lg">
                  <Link href="/listings/create">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Listing
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Listings Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Total Listings</div>
                  <div className="text-2xl font-bold text-white">{listings.length}</div>
                </div>
                <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Approved</div>
                  <div className="text-2xl font-bold text-green-400">
                    {listings.filter(l => l.status === 'approved').length}
                  </div>
                </div>
                <div className="bg-gray-900/50 border border-yellow-500/20 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Pending Review</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {listings.filter(l => l.status === 'pending').length}
                  </div>
                </div>
              </div>

              {/* Listings Grid - Client Component for interactivity */}
              <MyListingsGrid listings={listings} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
