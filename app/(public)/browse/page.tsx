/**
 * Browse Categories Page (Server Component)
 * 
 * Displays all categories in a responsive grid with:
 * - Category search with debouncing
 * - Filter and sort controls
 * - Category statistics and trending
 * - Interactive category cards
 * - SEO optimization with structured data
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7,
 *               3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10,
 *               4.1, 4.2, 4.3, 4.4, 4.5,
 *               10.1, 10.2, 10.3, 10.4, 10.5, 10.6,
 *               11.1, 11.2, 11.3, 11.4,
 *               14.1, 14.2, 18.1, 18.2, 18.3
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CategorySearch } from '@/components/features/category-search';
import { CategoryFilters } from '@/components/features/category-filters';
import { CategoryStats } from '@/components/features/category-stats';
import { CategoryGrid } from '@/components/features/category-grid';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { Footer } from '@/components/layout/footer';
import type { Category } from '@/lib/types/core';

// ============================================================================
// Types
// ============================================================================

interface PageProps {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    show_only?: string;
  }>;
}

type SortOption = 'alphabetical-asc' | 'alphabetical-desc' | 'most-listings' | 'fewest-listings' | 'recently-updated';
type ShowOnlyOption = 'top_level' | 'has_listings';

// Type for database row
interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  display_order: number;
  listing_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================================================
// ISR Configuration - Requirement 11.1
// ============================================================================

export const revalidate = 3600; // Revalidate every hour (3600 seconds)

// ============================================================================
// SEO Metadata - Requirement 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
// ============================================================================

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findam.ng';
  
  return {
    title: 'Browse Categories - FindAm',
    description: 'Explore all categories on FindAm. Discover services, businesses, and opportunities across Nigeria organized by category.',
    openGraph: {
      title: 'Browse Categories - FindAm',
      description: 'Explore all categories on FindAm. Discover services, businesses, and opportunities across Nigeria organized by category.',
      url: `${siteUrl}/browse`,
      siteName: 'FindAm',
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Browse Categories - FindAm',
      description: 'Explore all categories on FindAm. Discover services, businesses, and opportunities across Nigeria organized by category.',
    },
    alternates: {
      canonical: `${siteUrl}/browse`,
    },
  };
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Transform database row to Category type
 */
function transformCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parent_id: row.parent_id,
    description: row.description,
    image_url: row.image_url,
    display_order: row.display_order,
    listing_count: row.listing_count ?? 0,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

/**
 * Fetch all categories with their listing counts
 * Returns top-level categories with proper types
 */
async function getCategoriesWithCounts(): Promise<Category[]> {
  try {
    const supabase = await createClient();

    // Fetch categories with basic fields
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, description, image_url, display_order, listing_count, created_at, updated_at')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true }) as { data: CategoryRow[] | null; error: Error | null };

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    if (!data) return [];

    // Transform data to Category type
    return data.map(transformCategory);
  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    return [];
  }
}

/**
 * Server-side filtering based on show_only URL parameter
 * Requirements: 3.8, 3.9
 */
function applyServerSideFilter(
  categories: Category[],
  showOnly: ShowOnlyOption | undefined
): Category[] {
  if (!showOnly) return categories;

  switch (showOnly) {
    case 'top_level':
      // Filter to only top-level categories (parent_id is null)
      return categories.filter((cat) => cat.parent_id === null);
    case 'has_listings':
      // Filter to only categories with active listings
      return categories.filter((cat) => cat.listing_count > 0);
    default:
      return categories;
  }
}

// ============================================================================
// Structured Data - Requirement 10.5
// ============================================================================

function generateStructuredData(categories: Category[]) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findam.ng';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Browse Categories',
    description: 'Explore all categories on FindAm. Discover services, businesses, and opportunities across Nigeria organized by category.',
    url: `${siteUrl}/browse`,
    numberOfItems: categories.length,
    itemListElement: categories.slice(0, 10).map((category, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: category.name,
      url: `${siteUrl}/categories/${category.slug}`,
      description: category.description || undefined,
    })),
  };
}

// ============================================================================
// Main Component - Tasks 8.1, 8.2, 8.3
// ============================================================================

export default async function BrowsePage({ searchParams }: PageProps) {
  // Parse URL search params - Task 8.1
  const params = await searchParams;
  const search = params.search;
  const sort = params.sort;
  const show_only = params.show_only as ShowOnlyOption | undefined;

  // Fetch categories from database - Task 8.1
  let categories = await getCategoriesWithCounts();

  // Apply server-side filtering for show_only param - Task 8.1
  categories = applyServerSideFilter(categories, show_only);

  // Generate structured data for SEO - Task 8.3
  const structuredData = generateStructuredData(categories);

  return (
    <>
      {/* Structured Data for SEO - Requirement 10.5 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Page Header - Task 8.1 */}
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Browse Categories
            </h1>
            <p className="text-gray-400">
              Discover services, businesses, and opportunities across Nigeria
            </p>
          </div>
        </header>

        {/* Main Content - Task 8.2 - Requirement 9.5: Semantic HTML with role="main" */}
        <main className="flex-1 container mx-auto px-4 py-8" role="main" id="main-content">
          {/* Search and Filters Row - Task 8.2 - Requirement 9.5: role="navigation" */}
          <nav aria-label="Category search and filters" role="navigation">
            <div className="mb-8 space-y-4">
              <CategorySearch initialSearch={search} />
              <CategoryFilters 
                initialSort={sort} 
                initialShowOnly={show_only} 
              />
            </div>
          </nav>

          {/* Category Statistics - Task 8.2 */}
          <section className="mb-8" aria-label="Category statistics">
            <CategoryStats categories={categories} />
          </section>

          {/* Category Grid - Task 8.2 - Requirement 9.6: aria-live="polite" for dynamic updates */}
          <section aria-label="Categories" aria-live="polite" aria-atomic="false">
            <Suspense fallback={<LoadingSkeleton count={8} layout="grid" />}>
              <CategoryGrid 
                categories={categories}
                initialSearch={search}
                initialSort={sort}
              />
            </Suspense>
          </section>
        </main>

        {/* Footer - Task 8.2 */}
        <Footer />
      </div>
    </>
  );
}
