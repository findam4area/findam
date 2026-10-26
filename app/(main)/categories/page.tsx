import { createClient } from "@/lib/supabase/server";
import { CategoryGrid } from "@/components/categories/category-grid";
import { CategoryBreadcrumbs } from "@/components/categories/category-breadcrumbs";
import type { Category } from "@/lib/types";

// ISR: Revalidate every 1 hour (categories rarely change)
export const revalidate = 3600;

interface CategoriesPageProps {
  searchParams: Promise<Record<string, never>>;
}

/**
 * Categories page - displays all 23 main categories
 * Requirements: 3.1, 3.4
 * Features:
 * - Displays all 23 main categories in responsive grid
 * - Shows business count for each category
 * - Fully accessible with keyboard navigation
 */
export default async function CategoriesPage({ searchParams: searchParamsPromise }: CategoriesPageProps) {
  await searchParamsPromise;
  const supabase = await createClient();

  // Fetch all main categories (parent_id IS NULL)
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .eq("is_hidden", false)
    .order("display_order", { ascending: true });

  // Calculate business count for each category
  const { data: businessCounts } = await supabase
    .from("business_category_tags")
    .select("category_id");

  // Count businesses per category
  const countMap = new Map<string, number>();
  businessCounts?.forEach((tag) => {
    const count = countMap.get(tag.category_id) || 0;
    countMap.set(tag.category_id, count + 1);
  });

  // Apply business counts
  const categoriesWithCounts: Category[] = (categories || []).map((cat) => ({
      ...(cat as Category),
      business_count: countMap.get(cat.id) || 0,
      display_order: cat.display_order ?? 0,
      is_hidden: cat.is_hidden ?? false,
      created_at: cat.created_at ?? new Date().toISOString(),
      updated_at: cat.updated_at ?? new Date().toISOString(),
    }));

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <CategoryBreadcrumbs showHome className="mb-6" />

        {/* Page Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Browse Categories
            </h1>
            <p className="text-gray-400">
              Explore all {categoriesWithCounts.length} main categories with their subcategories
            </p>
          </div>
        </div>

        {/* Category Grid */}
        <CategoryGrid 
          categories={categoriesWithCounts}
          showBusinessCount={true}
        />

        {/* Info Section */}
        <div className="mt-12 glass-card p-6 rounded-2xl">
          <h2 className="text-2xl font-semibold text-white mb-4">
            About Categories
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-lg font-medium text-neon-cyan mb-2">
                Category Hierarchy
              </h3>
              <p>
                Each main category contains multiple subcategories to help you
                find exactly what you&apos;re looking for. Select a category to
                view its subcategories.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-neon-cyan mb-2">
                Explore by Business
              </h3>
              <p>
                Browse businesses organized by category to discover local services,
                products, and opportunities across Nigeria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
