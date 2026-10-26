import { redirect } from "next/navigation";
import { Metadata } from "next";
import { VendorApplicationForm } from "@/components/features/vendor-application-form";
import { requireAuth } from "@/lib/services/auth";

/**
 * Vendor Application Page - Task 8.11
 * 
 * Server Component that handles:
 * - Authentication guard using requireAuth() (redirects to login if not authenticated)
 * - Renders VendorApplicationForm for vendor application submission
 * - Provides proper SEO metadata
 * - Applies mobile-first responsive design with consistent layout
 * 
 * Requirements: 4.1, 4.2
 */

// ============================================================================
// Page Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "Apply as Vendor | FindAm",
  description: "Apply to become an approved vendor on FindAm. Get a verified badge and build customer trust.",
  robots: {
    index: false, // don't index authenticated pages
    follow: false,
  },
};

// ============================================================================
// Main Page Component
// ============================================================================

export default async function VendorApplicationPage() {
  // ========== Authentication Guard ==========
  // Use requireAuth() to ensure user is authenticated
  // This will throw UnauthorizedError if user is not logged in
  try {
    await requireAuth();
  } catch (error) {
    // Redirect to login page with return URL
    redirect("/login?redirect=/vendors/apply");
  }

  // ========== Render Form ==========
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Apply as Vendor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Become an approved vendor and earn a verified badge on your profile. 
            This helps build trust with customers and increases your visibility on FindAm.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Benefits of Being an Approved Vendor
          </h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Verified badge displayed on your profile and all listings</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Increased customer trust and credibility</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Higher visibility in search results</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Stand out from other service providers</span>
            </li>
          </ul>
        </div>

        {/* Application Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <VendorApplicationForm />
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Applications are typically reviewed within 2-3 business days. 
            You'll receive an email notification once your application has been processed.
          </p>
        </div>
      </div>
    </div>
  );
}
