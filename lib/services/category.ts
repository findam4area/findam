/**
 * Category Service for FindAm Directory Platform
 * 
 * This module provides optimized database operations for categories,
 * including hierarchical queries and batch fetching with relations.
 * 
 * Requirements: 1.1, 16.2, 16.3, 18.19, Performance optimization
 */

import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/types/core';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Category with subcategories (for hierarchical display)
 */
export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

/**
 * Category with listing count (for optimized queries)
 */
export interface CategoryWithCount extends Category {
  subcategories_count?: number;
}

// ============================================================================
// Helper Functions
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
    image_url: dbRecord.image_url || null,
    display_order: dbRecord.display_order ?? 0,
    listing_count: dbRecord.listing_count ?? 0,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
  };
}

/**
 * Log database errors with context
 */
function logError(context: string, error: any): void {
  console.error(`[CategoryService] ${context}:`, error.message || error);
}

// ============================================================================
// Main Category Functions
// ============================================================================

/**
 * Fetch all categories ordered by display_order, then name
 * 
 * Returns all categories for homepage category grid display.
 * Includes listing counts for each category.
 * 
 * Requirements: 1.1
 * 
 * @returns Promise<Category[]>
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      logError('getCategories', error);
      return [];
    }

    return data ? data.map(transformCategory) : [];
  } catch (error) {
    logError('getCategories (unexpected)', error);
    return [];
  }
}

/**
 * Fetch a single category by slug with optional subcategories
 * 
 * Used for category-specific pages to display category details
 * and optionally fetch subcategories for navigation.
 * 
 * Requirements: 16.2, 16.3
 * 
 * @param slug - Category slug (URL-friendly identifier)
 * @param includeSubcategories - Whether to fetch child categories
 * @returns Promise<CategoryWithSubcategories | null>
 */
export async function getCategoryBySlug(
  slug: string,
  includeSubcategories: boolean = false
): Promise<CategoryWithSubcategories | null> {
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
        // Not found
        return null;
      }
      logError('getCategoryBySlug', categoryError);
      return null;
    }

    if (!category) {
      return null;
    }

    const transformedCategory = transformCategory(category);

    // Fetch subcategories if requested (optimized - single query with parent_id index)
    if (includeSubcategories) {
      const { data: subcategories, error: subError } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', category.id)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (subError) {
        logError('getCategoryBySlug (subcategories)', subError);
        // Return category without subcategories rather than failing
        return {
          ...transformedCategory,
          subcategories: [],
        };
      }

      return {
        ...transformedCategory,
        subcategories: subcategories ? subcategories.map(transformCategory) : [],
      };
    }

    return {
      ...transformedCategory,
      subcategories: [],
    };
  } catch (error) {
    logError('getCategoryBySlug (unexpected)', error);
    return null;
  }
}

/**
 * Fetch only top-level categories (where parent_id is null)
 * 
 * Used for navigation menus and category selection dropdowns.
 * 
 * Requirements: 18.19
 * 
 * @returns Promise<Category[]>
 */
export async function getTopLevelCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      logError('getTopLevelCategories', error);
      return [];
    }

    return data ? data.map(transformCategory) : [];
  } catch (error) {
    logError('getTopLevelCategories (unexpected)', error);
    return [];
  }
}

/**
 * Fetch a single category by ID
 * 
 * Used for breadcrumb construction and detail page links.
 * 
 * @param id - Category UUID
 * @returns Promise<Category | null>
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      logError('getCategoryById', error);
      return null;
    }

    return data ? transformCategory(data) : null;
  } catch (error) {
    logError('getCategoryById (unexpected)', error);
    return null;
  }
}

// ============================================================================
// Optimized Batch Functions
// ============================================================================

/**
 * Fetch categories with subcategory counts in a single query
 * 
 * Optimized to avoid N+1 queries by using a window function or
 * counting subcategories in a single database round-trip.
 * 
 * Note: This uses a correlated subquery which is efficient for smaller datasets.
 * For very large category trees, consider denormalizing subcategories_count
 * into the categories table.
 * 
 * @returns Promise<CategoryWithCount[]>
 */
export async function getCategoriesWithSubcategoryCounts(): Promise<CategoryWithCount[]> {
  try {
    const supabase = await createClient();

    // Fetch categories with subcategory counts using a single query
    // This approach uses a lateral join to count subcategories efficiently
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories:categories!parent_id(count)
      `);

    if (error) {
      logError('getCategoriesWithSubcategoryCounts', error);
      // Fallback to basic categories without counts
      return getCategories() as Promise<CategoryWithCount[]>;
    }

    if (!data) {
      return [];
    }

    return data.map((record: any) => ({
      ...transformCategory(record),
      subcategories_count: record.subcategories?.[0]?.count ?? 0,
    }));
  } catch (error) {
    logError('getCategoriesWithSubcategoryCounts (unexpected)', error);
    return [];
  }
}

/**
 * Fetch top-level categories with their immediate subcategories
 * 
 * Optimized batch fetch for navigation menus that need the full tree
 * but want to avoid multiple round-trips.
 * 
 * @returns Promise<CategoryWithSubcategories[]>
 */
export async function getCategoriesWithSubcategories(): Promise<CategoryWithSubcategories[]> {
  try {
    const supabase = await createClient();

    // First get all top-level categories
    const { data: topLevelCategories, error: topLevelError } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (topLevelError) {
      logError('getCategoriesWithSubcategories (top-level)', topLevelError);
      return [];
    }

    if (!topLevelCategories || topLevelCategories.length === 0) {
      return [];
    }

    // Get all subcategories in a single query
    const parentIds = topLevelCategories.map((c) => c.id);
    const { data: allSubcategories, error: subError } = await supabase
      .from('categories')
      .select('*')
      .in('parent_id', parentIds)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (subError) {
      logError('getCategoriesWithSubcategories (subcategories)', subError);
      // Return top-level categories without subcategories
      return topLevelCategories.map((c) => ({
        ...transformCategory(c),
        subcategories: [],
      }));
    }

    // Group subcategories by parent_id
    const subcategoriesByParent = new Map<string, Category[]>();
    if (allSubcategories) {
      for (const sub of allSubcategories) {
        const parentId = sub.parent_id;
        if (!subcategoriesByParent.has(parentId)) {
          subcategoriesByParent.set(parentId, []);
        }
        subcategoriesByParent.get(parentId)!.push(transformCategory(sub));
      }
    }

    // Combine top-level categories with their subcategories
    return topLevelCategories.map((category) => ({
      ...transformCategory(category),
      subcategories: subcategoriesByParent.get(category.id) || [],
    }));
  } catch (error) {
    logError('getCategoriesWithSubcategories (unexpected)', error);
    return [];
  }
}

/**
 * Get category breadcrumb path (category and all ancestors)
 * 
 * Used for breadcrumb navigation on category detail pages.
 * 
 * @param categoryId - The category ID to get the breadcrumb for
 * @returns Promise<Category[]> - Array from root to target category
 */
export async function getCategoryBreadcrumb(categoryId: string): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const breadcrumb: Category[] = [];
    let currentId: string | null = categoryId;

    // Traverse up the category tree
    while (currentId) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', currentId)
        .single();

      if (error || !data) {
        break;
      }

      breadcrumb.unshift(transformCategory(data));
      currentId = data.parent_id;
    }

    return breadcrumb;
  } catch (error) {
    logError('getCategoryBreadcrumb', error);
    return [];
  }
}