/**
 * Homepage - FindAm Directory
 * 
 * Main landing page with:
 * - HeroSection with search
 * - CategoryGrid for browsing categories
 * - FeaturedListings showcase
 * - Footer with links
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 * Task: 4.11
 */

import { Suspense } from 'react';
import type { Metadata } from "next";
import { HeroSection, HeroSectionSkeleton } from "@/components/features/hero-section";
import { CategoryGrid, CategoryGridSkeleton } from "@/components/features/category-grid";
import { FeaturedListings, FeaturedListingsSkeleton } from "@/components/features/featured-listings";
import { Footer } from "@/components/layout/footer";
import { NavigationBar } from "@/components/layout/navigation-bar";
import { getCurrentUser } from "@/lib/services/auth";

// SEO Metadata - Requirement 10.6
export const metadata: Metadata = {
  title: "FindAm - Find Services & Opportunities Across Nigeria",
  description: "Connect with verified vendors, discover local businesses, and find the perfect service for your needs. From tech to fashion, food to freelancing—all in one place.",
  keywords: ["Nigeria marketplace", "services", "vendors", "local businesses", "opportunities"],
  openGraph: {
    title: "FindAm - Find Services & Opportunities Across Nigeria",
    description: "Connect with verified vendors and discover local businesses across Nigeria.",
    type: "website",
    locale: "en_NG",
    siteName: "FindAm",
  },
  twitter: {
    card: "summary_large_image",
    title: "FindAm - Find Services & Opportunities Across Nigeria",
    description: "Connect with verified vendors and discover local businesses across Nigeria.",
  },
};

export default async function HomePage() {
  // Get current user for navigation bar
  const user = await getCurrentUser();

  return (
    <>
      {/* Navigation Bar - Requirement 8.1-8.9 */}
      <NavigationBar user={user} />

      {/* Main Content - Requirement 10.1, 10.7 */}
      <main className="min-h-screen bg-gray-950">
        {/* Hero Section - Requirements: 9.1-9.7, 10.2 */}
        <Suspense fallback={<HeroSectionSkeleton />}>
          <HeroSection />
        </Suspense>

        {/* Category Grid Section - Requirements: 1.1-1.8, 10.3 */}
        <section 
          className="py-16 lg:py-24" 
          aria-labelledby="categories-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 
                id="categories-heading" 
                className="text-3xl lg:text-4xl font-bold text-white mb-4"
              >
                Browse by Category
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Discover services and opportunities across various categories
              </p>
            </div>
            
            <Suspense fallback={<CategoryGridSkeleton />}>
              <CategoryGrid />
            </Suspense>
          </div>
        </section>

        {/* Featured Listings Section - Requirements: 5.1-5.8, 10.4 */}
        <section 
          className="py-16 lg:py-24 bg-gray-900/50" 
          aria-labelledby="featured-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 
                id="featured-heading" 
                className="text-3xl lg:text-4xl font-bold text-white mb-4"
              >
                Featured Listings
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Handpicked listings from verified vendors
              </p>
            </div>
            
            <Suspense fallback={<FeaturedListingsSkeleton />}>
              <FeaturedListings limit={6} />
            </Suspense>
          </div>
        </section>

        {/* Spacer for visual balance */}
        <div className="h-16 lg:h-24" />
      </main>

      {/* Footer - Requirements: 7.1-7.7, 10.5 */}
      <Footer />
    </>
  );
}
