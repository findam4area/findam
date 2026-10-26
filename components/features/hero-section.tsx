/**
 * HeroSection Server Component
 * 
 * Main hero section for the homepage with:
 * - Prominent headline and subheadline
 * - Functional search bar with category filter
 * - CTA buttons (Sign Up, Browse Categories)
 * - Background imagery with proper contrast
 * - Mobile-first responsive design
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { getTopLevelCategories } from "@/lib/services/database";
import { HeroSearch } from "./hero-search";

export async function HeroSection() {
  // Fetch categories for search filter
  const categories = await getTopLevelCategories();

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.jpg"
          alt="FindAm Directory Background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4="
        />
        {/* Gradient overlay for better text contrast - WCAG AA compliant */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/90 via-gray-950/80 to-gray-950/95" />
        {/* Additional radial gradient for focus */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-gray-950/50 to-gray-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary-500/10 border border-primary-500/30 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-300">
              Discover Nigeria&apos;s Best Services & Opportunities
            </span>
          </div>

          {/* Main Headline - Requirement 9.1 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Find Services & Opportunities{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              Across Nigeria
            </span>
          </h1>

          {/* Subheadline - Requirement 9.2 */}
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with verified vendors, discover local businesses, and find the perfect service 
            for your needs. From tech to fashion, food to freelancing—all in one place.
          </p>

          {/* Search Bar - Requirements 9.5, 9.6, 9.7 */}
          <div className="mb-10">
            {categories && categories.length > 0 ? (
              <HeroSearch categories={categories} />
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/browse">
                  <Button size="lg" variant="neon" className="h-14 px-8 font-semibold w-full sm:w-auto">
                    Browse Listings
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* CTA Buttons - Requirement 9.3 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button
                size="lg"
                variant="default"
                className="h-12 px-8 font-semibold bg-white text-gray-900 hover:bg-gray-100 w-full sm:w-auto"
              >
                Sign Up Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/categories">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 font-semibold border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
              >
                Browse Categories
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Verified Vendors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Secure Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span>Local Communities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
    </section>
  );
}

/**
 * HeroSectionSkeleton - Loading placeholder
 * Use with React Suspense for streaming
 */
export function HeroSectionSkeleton() {
  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/90 to-gray-950/95" />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="h-8 w-64 bg-gray-800 rounded-full mx-auto animate-pulse" />
          <div className="h-16 w-full max-w-2xl bg-gray-800 rounded mx-auto animate-pulse" />
          <div className="h-6 w-full max-w-xl bg-gray-800 rounded mx-auto animate-pulse" />
          <div className="h-14 w-full max-w-3xl bg-gray-800 rounded-lg mx-auto animate-pulse" />
          <div className="flex gap-4 justify-center">
            <div className="h-12 w-40 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-12 w-40 bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
