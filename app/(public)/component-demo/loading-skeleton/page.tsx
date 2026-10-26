"use client";

/**
 * LoadingSkeleton Component Demo
 * 
 * Visual demonstration of the LoadingSkeleton component in various configurations.
 * This page is for development/testing purposes only.
 */

import { LoadingSkeleton } from "@/components/shared";

export default function LoadingSkeletonDemo() {
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            LoadingSkeleton Component Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Visual showcase of loading skeleton variations
          </p>
        </div>

        {/* Grid Layout - Default (8 cards) */}
        <section className="space-y-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-semibold text-white">
              Grid Layout (Default)
            </h2>
            <span className="text-sm text-gray-500">
              count=8 (default), layout="grid"
            </span>
          </div>
          <p className="text-gray-400">
            Responsive grid: 1 column mobile, 2 tablet, 3 desktop, 4 large screens
          </p>
          <LoadingSkeleton />
        </section>

        {/* Grid Layout - Custom Count */}
        <section className="space-y-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-semibold text-white">
              Grid Layout (Custom Count)
            </h2>
            <span className="text-sm text-gray-500">
              count=4, layout="grid"
            </span>
          </div>
          <p className="text-gray-400">
            Useful for subcategory sections or smaller grids
          </p>
          <LoadingSkeleton count={4} />
        </section>

        {/* List Layout */}
        <section className="space-y-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-semibold text-white">
              List Layout
            </h2>
            <span className="text-sm text-gray-500">
              count=5, layout="list"
            </span>
          </div>
          <p className="text-gray-400">
            Vertical list layout with horizontal cards
          </p>
          <LoadingSkeleton layout="list" count={5} />
        </section>

        {/* Large Count Demo */}
        <section className="space-y-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-semibold text-white">
              Large Count
            </h2>
            <span className="text-sm text-gray-500">
              count=16, layout="grid"
            </span>
          </div>
          <p className="text-gray-400">
            Demonstrates performance with many skeleton cards
          </p>
          <LoadingSkeleton count={16} />
        </section>

        {/* Features Section */}
        <section className="space-y-4 border-t border-gray-800 pt-8">
          <h2 className="text-2xl font-semibold text-white">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Shimmer Animation
              </h3>
              <p className="text-sm">
                Smooth 2-second shimmer effect that respects prefers-reduced-motion for accessibility
              </p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Responsive Design
              </h3>
              <p className="text-sm">
                Automatically adapts to screen size with Tailwind's responsive utilities
              </p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Accessibility
              </h3>
              <p className="text-sm">
                Includes proper ARIA attributes (role="status", aria-live, aria-label)
              </p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Design System Match
              </h3>
              <p className="text-sm">
                Matches CategoryCard and SubcategoryCard dimensions and styling exactly
              </p>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="space-y-4 border-t border-gray-800 pt-8">
          <h2 className="text-2xl font-semibold text-white">
            Usage Examples
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Default Usage
              </h3>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`<LoadingSkeleton />`}
              </pre>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Custom Count
              </h3>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`<LoadingSkeleton count={12} />`}
              </pre>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                List Layout
              </h3>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`<LoadingSkeleton layout="list" count={5} />`}
              </pre>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                With Suspense (Recommended)
              </h3>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`<Suspense fallback={<LoadingSkeleton />}>
  <CategoryGrid />
</Suspense>`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
