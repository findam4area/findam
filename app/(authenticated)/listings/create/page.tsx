import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ListingForm } from "@/components/features/listing-form";
import { getCategories } from "@/lib/services/database";
import { requireAuth } from "@/lib/services/auth";

/**
 * CreateListing Page - Task 6.9
 * 
 * Server Component that handles:
 * - Authentication guard using requireAuth() (redirects to login if not authenticated)
 * - Fetches categories from database using getCategories() from database service
 * - Defines Nigerian states array directly in code
 * - Renders ListingForm with fetched categories
 * - Provides proper SEO metadata
 * - Applies consistent page layout with container and padding
 * 
 * Requirements: 13.1, 13.16
 */

// ============================================================================
// Nigerian States Array
// ============================================================================

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

// ============================================================================
// Page Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "Create Listing | FindAm",
  description: "Create a new listing on FindAm. Upload images, add details, and reach customers across Nigeria.",
  robots: {
    index: false, // Don't index authenticated pages
    follow: false,
  },
};

// ============================================================================
// Main Page Component
// ============================================================================

export default async function CreateListingPage() {
  // ========== Authentication Guard ==========
  // Use requireAuth() to ensure user is authenticated
  // This will throw UnauthorizedError if user is not logged in
  try {
    await requireAuth();
  } catch (error) {
    // Redirect to login page with return URL
    redirect("/login?redirect=/listings/create");
  }

  // ========== Fetch Categories ==========
  // Fetch all categories using getCategories() from database service
  const categories = await getCategories();

  // Handle categories fetch error
  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold">
            Unable to Load Categories
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn&apos;t load the categories. Please check your internet
            connection and try again.
          </p>
          <Link
            href="/listings/create"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // ========== Render Form ==========
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Listing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Fill in the details below to create your listing. All listings are
            reviewed before going live.
          </p>
        </div>

        {/* Listing Form Component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <ListingForm categories={categories} />
        </div>
      </div>
    </div>
  );
}
