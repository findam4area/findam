/**
 * Homepage - FindAm Directory
 * 
 * Main landing page with:
 * - Modern Hero Carousel with slides
 * - FeaturedListings showcase
 * - Footer with links
 * 
 * Requirements: 10.1, 10.2, 10.4, 10.5, 10.6, 10.7
 * Task: 4.11
 */

import type { Metadata } from "next";
import { HeroCarousel } from "@/components/features/hero-carousel";
import { FeaturedListings, FeaturedListingsSkeleton } from "@/components/features/featured-listings";
import { Footer } from "@/components/layout/footer";
import { NavigationBar } from "@/components/layout/navigation-bar";
import { getCurrentUser } from "@/lib/services/auth";
import { Suspense } from 'react';

// SEO Metadata - Requirement 10.6
// Performance Optimization: Enable static generation with revalidation
// Task 10.15 - Requirement 11.5, 11.8
export const revalidate = 3600; // Revalidate every hour (1 hour = 3600 seconds)

export const metadata: Metadata = {
  title: "FindAm - Find Services & Opportunities Across Nigeria",
  description: "Connect with verified vendors, discover local businesses, and find the perfect service for your needs. From tech to fashion, food to freelancing—all in one place.",
  keywords: ["Nigeria marketplace", "services", "vendors", "local businesses", "opportunities"],
  openGraph: {
    title: "FindAm - Find Services & Opportunities Across Nigeria",
    description: "Connect with verified vendors and discover local businesses",
    type: "website",
  },
};

export default async function HomePage() {
  // Get current user for personalized navigation
  const user = await getCurrentUser();

  return (
    <>
      {/* Navigation - Requirement 10.4 */}
      <NavigationBar user={user} />

      {/* Main Content - Requirement 10.1, 10.7 */}
      <main className="min-h-screen bg-gray-950">
        {/* Hero Carousel - Modern sliding hero section */}
        <HeroCarousel />

        {/* Featured Listings - Requirement 10.2, 10.7, Task 10.15 */}
        <Suspense fallback={<FeaturedListingsSkeleton />}>
          <FeaturedListings />
        </Suspense>
      </main>

      {/* Footer - Requirement 10.5 */}
      <Footer />
    </>
  );
}