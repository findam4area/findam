/**
 * CategoryDetailPage - Server Component
 * 
 * Displays a category detail page with:
 * - Hierarchical breadcrumb navigation
 * - Parent category back button
 * - Category header with image, name, description
 * - Subcategories grid (when subcategories exist)
 * - Category listings section
 * - Footer component
 * - SEO metadata with Open Graph tags
 * - Focus management for accessibility (Requirement 16.33)
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.11, 16.12, 16.13,
 *               16.14, 16.15, 16.33, 16.39, 16.46, 16.47, 16.48, 16.52, 18.1, 18.2, 18.3
 * 
 * Tasks: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 16.2
 */

import { Suspense } from 'react';
import { FocusOnMount } from '@/components/shared/focus-on-mount';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumb, BreadcrumbItem } from '@/components/shared/breadcrumb';
import { SubcategoryGrid } from '@/components/features/subcategory-grid';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { Footer } from '@/components/layout/footer';
import type { Category } from '@/lib/types/core';

// ============================================================================
// Types
// ============================================================================

interface CategoryDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ============================================================================
// ISR Configuration - Requirement 16.52
// ============================================================================

export const revalidate = 1800; // Revalidate every 30 minutes

// ============================================================================
// SEO Metadata - Requirements 16.39, 16.46, 16.47, 16.48
// ============================================================================

export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug, false);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://findam.ng';

  return {
    title: `${category.name} - Browse Subcategories - FindAm`,
    description: category.description || `Explore ${category.name} listings on FindAm. Discover services, businesses, and opportunities.`,
    openGraph: {
      title: `${category.name} - Browse Subcategories - FindAm`,
      description: category.description || `Explore ${category.name} listings on FindAm.`,
      url: `${siteUrl}/categories/${category.slug}`,
      siteName: 'FindAm',
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} - Browse Subcategories - FindAm`,
      description: category.description || `Explore ${category.name} listings on FindAm.`,
    },
    alternates: {
      canonical: `${siteUrl}/categories/${category.slug}`,
    },
  };
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Transform database record to Category type
 */
function transformCategory(dbRecord: any): Category {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    slug: dbRecord.slug || dbRecord.name.toLowerCase().replace(/\s+/g, '-'),
    parent_id: dbRecord.parent_id,
    description: dbRecord.description,
    image_url: (dbRecord.image_url && typeof dbRecord.image_url === 'string' && dbRecord.image_url.startsWith('http'))
      ? dbRecord.image_url
      : null,
    display_order: dbRecord.display_order,
    listing_count: dbRecord.listing_count || 0,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
  };
}

/**
 * Fetch a single category by slug
 * Requirements: 16.2
 */
async function getCategoryBySlug(slug: string, includeSubcategories: boolean = false): Promise<(Category & { subcategories?: Category[] }) | null> {
  try {
    const supabase = await createClient();

    // Fetch main category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (categoryError) {
      if (categoryError.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching category by slug:', categoryError);
      return null;
    }

    if (!category) {
      return null;
    }

    const transformedCategory = transformCategory(category);

    // Fetch subcategories if requested
    if (includeSubcategories) {
      const { data: subcategories, error: subError } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', category.id)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (subError) {
        console.error('Error fetching subcategories:', subError);
      } else {
        return {
          ...transformedCategory,
          subcategories: subcategories ? subcategories.map(transformCategory) : [],
        };
      }
    }

    return transformedCategory;
  } catch (error) {
    console.error('Unexpected error in getCategoryBySlug:', error);
    return null;
  }
}

/**
 * Fetch a category by ID
 * Used for breadcrumb construction and parent category lookup
 */
async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const supabase = await createClient();

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching category by ID:', error);
      return null;
    }

    return category ? transformCategory(category) : null;
  } catch (error) {
    console.error('Unexpected error in getCategoryById:', error);
    return null;
  }
}

/**
 * Fetch subcategories for a category
 * Requirements: 16.3
 */
async function getSubcategories(parentId: string): Promise<Category[]> {
  try {
    const supabase = await createClient();

    const { data: subcategories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }

    return subcategories ? subcategories.map(transformCategory) : [];
  } catch (error) {
    console.error('Unexpected error in getSubcategories:', error);
    return [];
  }
}

// ============================================================================
// Build Hierarchical Breadcrumb - Task 10.2
// Requirements: 16.11, 16.12, 16.13
// ============================================================================

/**
 * Build hierarchical breadcrumb by traversing parent chain
 * Recursively fetches parent categories up to root
 */
async function buildCategoryBreadcrumb(category: Category): Promise<BreadcrumbItem[]> {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Browse Categories', href: '/browse' },
  ];

  // Build path by traversing parent chain
  const path: Category[] = [];
  let current: Category | null = category;

  // Traverse up to root
  while (current?.parent_id) {
    const parent = await getCategoryById(current.parent_id);
    if (parent) {
      path.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  // Add all parents to breadcrumb
  for (const cat of path) {
    items.push({ label: cat.name, href: `/categories/${cat.slug}` });
  }

  // Add current category as the last item (current page)
  items.push({ label: category.name, href: `/categories/${category.slug}` });

  return items;
}

// ============================================================================
// Placeholder image for categories without images
// ============================================================================

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop';

function getValidImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return PLACEHOLDER_IMAGE;
  
  if (imageUrl.startsWith('/') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  return PLACEHOLDER_IMAGE;
}

// ============================================================================
// Main Component - Tasks 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
// ============================================================================

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { slug } = await params;

  // Fetch category by slug - Task 10.1
  const category = await getCategoryBySlug(slug, false);

  // Return 404 if category not found - Task 10.1
  if (!category) {
    notFound();
  }

  // Fetch subcategories - Task 10.1
  const subcategories = await getSubcategories(category.id);

  // Fetch parent category - Task 10.3
  const parentCategory = category.parent_id ? await getCategoryById(category.parent_id) : null;

  // Build hierarchical breadcrumb - Task 10.2
  const breadcrumbItems = await buildCategoryBreadcrumb(category);

  // Get valid image URL
  const categoryImageUrl = getValidImageUrl(category.image_url);

  return (
    <>
      {/* Structured data for SEO - Requirements 16.37, 16.38 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.label,
              item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://findam.ng'}${item.href}`,
            })),
          }),
        }}
      />

      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Breadcrumb Navigation - Task 10.2 */}
        <div className="bg-gray-900/50 border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        {/* Main Content - Requirement 9.5: role="main" */}
        <main className="flex-1" role="main">
          {/* Parent Category Back Button - Task 10.3 */}
          {parentCategory && (
            <div className="container mx-auto px-4 pt-6">
              <Link
                href={`/categories/${parentCategory.slug}`}
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                aria-label={`Back to ${parentCategory.name} category`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to {parentCategory.name}
              </Link>
            </div>
          )}

          {/* Category Header - Task 10.3 */}
          {/* Requirements: 16.4, 16.13, 16.14, 16.33 */}
          <header className="bg-gradient-to-br from-gray-900 via-gray-900 to-primary-950/30 border-b border-gray-800">
            <div className="container mx-auto px-4 py-8 md:py-12">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                {/* Category Image */}
                <div className="relative w-full md:w-48 h-48 rounded-xl overflow-hidden border border-gray-800 shadow-lg flex-shrink-0">
                  <Image
                    src={categoryImageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 192px"
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Category Info */}
                <div className="flex-1">
                  {/* Category Name - h1 for heading hierarchy - Requirement 16.39 */}
                  {/* Focus management - Requirement 16.33: Set focus on main heading when page loads */}
                  <FocusOnMount>
                    <h1 
                      className="text-3xl md:text-4xl font-bold text-white mb-3"
                      tabIndex={-1}
                      id="category-heading"
                    >
                      {category.name}
                    </h1>
                  </FocusOnMount>

                  {category.description && (
                    <p className="text-gray-300 text-lg mb-4 leading-relaxed">
                      {category.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect width="7" height="9" x="3" y="3" rx="1" />
                      <rect width="7" height="5" x="14" y="3" rx="1" />
                      <rect width="7" height="9" x="14" y="12" rx="1" />
                      <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                    <span className="text-sm" aria-label={`${category.listing_count} listings in this category`}>
                      {category.listing_count} {category.listing_count === 1 ? 'listing' : 'listings'} in this category
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Subcategories Section - Task 10.4 */}
          {/* Requirements: 16.5, 16.6, 16.15, 16.29 */}
          <div className="container mx-auto px-4 py-8">
            {subcategories.length > 0 ? (
              <section aria-label="Subcategories" role="region">
                <Suspense
                  fallback={
                    <LoadingSkeleton count={8} layout="grid" />
                  }
                >
                  <SubcategoryGrid subcategories={subcategories} parentCategoryId={category.id} />
                </Suspense>
              </section>
            ) : (
              /* Show listings section when no subcategories - Task 10.5 */
              /* Requirements: 16.1 */
              <CategoryListingsSection
                categoryId={category.id}
                categoryName={category.name}
                categorySlug={category.slug}
              />
            )}
          </div>
        </main>

        {/* Footer - Task 10.6 */}
        {/* Requirements: 18.1, 18.2, 18.3 */}
        <Footer />
      </div>
    </>
  );
}

// ============================================================================
// Category Listings Section Component - Task 10.5
// Requirements: 16.1
// ============================================================================

/**
 * CategoryListingsSection - Client component wrapper
 * Shows listings in the category when there are no subcategories
 */
async function CategoryListingsSection({
  categoryId,
  categoryName,
  categorySlug,
}: {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}) {
  // Fetch listings for this category
  const listings = await getListingsForCategory(categoryId);

  return (
    <section className="space-y-6">
      {/* Section Header - h2 for heading hierarchy - Requirement 16.39 */}
      <div className="relative">
        <h2 className="text-2xl font-bold text-white">
          Listings in {categoryName}
        </h2>
        {/* Gradient underline */}
        <div className="absolute bottom-0 left-0 w-32 h-1 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full" />
      </div>

      {/* Listings count */}
      <p className="text-sm text-gray-400">
        {listings.length} {listings.length === 1 ? 'listing' : 'listings'} available
      </p>

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing, index) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">
            No listings yet
          </h3>
          <p className="text-gray-400 mb-6 max-w-md">
            There are no listings in {categoryName} yet. Check back soon!
          </p>
          <Link
            href="/browse"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            Browse Other Categories
          </Link>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Listing fetching for category
// ============================================================================

async function getListingsForCategory(categoryId: string): Promise<any[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(*),
        user:users!user_id(id, email, username, avatar_url)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching listings for category:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching listings:', error);
    return [];
  }
}

// ============================================================================
// Simple ListingCard Component
// ============================================================================

function ListingCard({ listing, priority = false }: { listing: any; priority?: boolean }) {
  const primaryImage = listing.images?.[listing.primary_image_index || 0] || listing.images?.[0] || '/placeholder-listing.jpg';

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-800">
        <Image
          src={primaryImage}
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-1">
          {listing.title}
        </h3>
        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
          {listing.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">
            {listing.location_city}, {listing.location_state}
          </span>
          {listing.price && (
            <span className="text-primary-400 font-semibold">
              ₦{listing.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}