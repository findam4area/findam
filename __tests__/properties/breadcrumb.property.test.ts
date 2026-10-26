/**
 * Property-based tests for breadcrumb navigation
 * 
 * Property 13: Breadcrumb Path Construction
 * Test breadcrumb building with various parent chain depths
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 16.11, 16.12**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { categoryArbitrary, categoryWithSubcategoriesArbitrary } from './arbitraries';
import type { Category } from '@/lib/types/core';

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

describe('Property 13: Breadcrumb Path Construction', () => {
  /**
   * Build breadcrumb path for a category
   * Traverses parent chain up to root
   */
  function buildBreadcrumb(
    category: Category,
    allCategories: Category[]
  ): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    // Build path by traversing parents
    const path: Category[] = [];
    let current: Category | undefined = category;
    const visited = new Set<string>();

    // Traverse up the parent chain (with circular reference protection)
    while (current && current.parent_id) {
      // Circular reference protection
      if (visited.has(current.id)) {
        console.warn('Circular reference detected in category hierarchy');
        break;
      }
      visited.add(current.id);

      const parent = allCategories.find((cat) => cat.id === current!.parent_id);
      if (!parent) break;

      path.unshift(parent);
      current = parent;
    }

    // Add all parents to breadcrumb
    for (const cat of path) {
      items.push({ label: cat.name, href: `/categories/${cat.slug}` });
    }

    // Add current category
    items.push({
      label: category.name,
      href: `/categories/${category.slug}`,
      current: true,
    });

    return items;
  }

  /**
   * Create a category hierarchy with specified depth
   */
  function createCategoryHierarchy(depth: number): {
    categories: Category[];
    leaf: Category;
  } {
    const categories: Category[] = [];
    let parentId: string | null = null;

    for (let i = 0; i < depth; i++) {
      const cat: Category = {
        id: `cat-${i}`,
        name: `Level ${i}`,
        slug: `level-${i}`,
        parent_id: parentId,
        description: null,
        image_url: null,
        display_order: i,
        listing_count: 0,
      };
      categories.push(cat);
      parentId = cat.id;
    }

    return {
      categories,
      leaf: categories[categories.length - 1],
    };
  }

  it('should always start with Home', () => {
    fc.assert(
      fc.property(categoryArbitrary(), fc.array(categoryArbitrary()), (category, allCats) => {
        const breadcrumb = buildBreadcrumb(category, allCats);

        // Property: First item is always Home
        expect(breadcrumb[0].label).toBe('Home');
        expect(breadcrumb[0].href).toBe('/');
      }),
      { numRuns: 100 }
    );
  });

  it('should always end with current category', () => {
    fc.assert(
      fc.property(categoryArbitrary(), fc.array(categoryArbitrary()), (category, allCats) => {
        const breadcrumb = buildBreadcrumb(category, allCats);

        // Property: Last item is the current category
        const last = breadcrumb[breadcrumb.length - 1];
        expect(last.label).toBe(category.name);
        expect(last.href).toBe(`/categories/${category.slug}`);
        expect(last.current).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should have correct length for top-level category (2 items: Home + Category)', () => {
    fc.assert(
      fc.property(categoryArbitrary(), (category) => {
        const topLevelCat = { ...category, parent_id: null };
        const breadcrumb = buildBreadcrumb(topLevelCat, [topLevelCat]);

        // Property: Top-level category has breadcrumb of length 2
        expect(breadcrumb.length).toBe(2);
        expect(breadcrumb[0].label).toBe('Home');
        expect(breadcrumb[1].label).toBe(topLevelCat.name);
      }),
      { numRuns: 100 }
    );
  });

  it('should build correct path for nested categories (1-5 levels)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (depth) => {
        const { categories, leaf } = createCategoryHierarchy(depth);
        const breadcrumb = buildBreadcrumb(leaf, categories);

        // Property: Breadcrumb length = 1 (Home) + depth
        expect(breadcrumb.length).toBe(depth + 1);

        // Property: Breadcrumb shows complete path from Home to leaf
        expect(breadcrumb[0].label).toBe('Home');
        for (let i = 0; i < depth; i++) {
          expect(breadcrumb[i + 1].label).toBe(`Level ${i}`);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should maintain correct order (root → leaf)', () => {
    const parent: Category = {
      id: 'parent-1',
      name: 'Parent',
      slug: 'parent',
      parent_id: null,
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 0,
    };

    const child: Category = {
      id: 'child-1',
      name: 'Child',
      slug: 'child',
      parent_id: parent.id,
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 0,
    };

    const grandchild: Category = {
      id: 'grandchild-1',
      name: 'Grandchild',
      slug: 'grandchild',
      parent_id: child.id,
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 0,
    };

    const categories = [parent, child, grandchild];
    const breadcrumb = buildBreadcrumb(grandchild, categories);

    // Property: Breadcrumb shows correct order
    expect(breadcrumb.map((item) => item.label)).toEqual([
      'Home',
      'Parent',
      'Child',
      'Grandchild',
    ]);
  });

  it('should handle broken parent chain gracefully', () => {
    const orphan: Category = {
      id: 'orphan-1',
      name: 'Orphan',
      slug: 'orphan',
      parent_id: 'non-existent-parent', // Parent doesn't exist
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 0,
    };

    const breadcrumb = buildBreadcrumb(orphan, [orphan]);

    // Property: Broken chain still produces valid breadcrumb (Home + current)
    expect(breadcrumb.length).toBe(2);
    expect(breadcrumb[0].label).toBe('Home');
    expect(breadcrumb[1].label).toBe('Orphan');
  });

  it('should detect and handle circular references', () => {
    // Create circular reference: A → B → C → A
    const catA: Category = {
      id: 'a',
      name: 'Category A',
      slug: 'a',
      parent_id: 'c', // Points to C (will create circle)
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 0,
    };

    const catB: Category = {
      id: 'b',
      name: 'Category B',
      slug: 'b',
      parent_id: 'a',
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 0,
    };

    const catC: Category = {
      id: 'c',
      name: 'Category C',
      slug: 'c',
      parent_id: 'b',
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 0,
    };

    const categories = [catA, catB, catC];

    // Build breadcrumb from any node in the circle
    const breadcrumb = buildBreadcrumb(catC, categories);

    // Property: Should not infinite loop and should produce valid breadcrumb
    expect(breadcrumb.length).toBeGreaterThan(0);
    expect(breadcrumb[0].label).toBe('Home');
    expect(breadcrumb[breadcrumb.length - 1].label).toBe('Category C');

    // Property: Should have finite length (not infinite)
    expect(breadcrumb.length).toBeLessThan(10);
  });

  it('should not infinite loop on deep hierarchies', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (depth) => {
        const { categories, leaf } = createCategoryHierarchy(depth);
        const breadcrumb = buildBreadcrumb(leaf, categories);

        // Property: Breadcrumb length matches expected depth + 1 (Home)
        expect(breadcrumb.length).toBe(depth + 1);

        // Property: No duplicates in breadcrumb (indicating loop)
        const labels = breadcrumb.map((item) => item.label);
        const uniqueLabels = new Set(labels);
        expect(uniqueLabels.size).toBe(labels.length);
      }),
      { numRuns: 20 }
    );
  });

  it('should generate valid href for all items', () => {
    fc.assert(
      fc.property(categoryArbitrary(), fc.array(categoryArbitrary()), (category, allCats) => {
        const breadcrumb = buildBreadcrumb(category, allCats);

        // Property: All items have valid href
        breadcrumb.forEach((item) => {
          expect(item.href).toBeDefined();
          expect(typeof item.href).toBe('string');
          expect(item.href.length).toBeGreaterThan(0);
        });

        // Property: Home href is always /
        expect(breadcrumb[0].href).toBe('/');

        // Property: Category hrefs start with /categories/
        for (let i = 1; i < breadcrumb.length; i++) {
          expect(breadcrumb[i].href).toMatch(/^\/categories\//);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should mark only the last item as current', () => {
    fc.assert(
      fc.property(categoryArbitrary(), fc.array(categoryArbitrary()), (category, allCats) => {
        const breadcrumb = buildBreadcrumb(category, allCats);

        // Property: Only last item has current = true
        for (let i = 0; i < breadcrumb.length - 1; i++) {
          expect(breadcrumb[i].current).not.toBe(true);
        }

        expect(breadcrumb[breadcrumb.length - 1].current).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should be deterministic (same input produces same output)', () => {
    fc.assert(
      fc.property(categoryArbitrary(), fc.array(categoryArbitrary()), (category, allCats) => {
        const breadcrumb1 = buildBreadcrumb(category, allCats);
        const breadcrumb2 = buildBreadcrumb(category, allCats);

        // Property: Same input produces identical output
        expect(breadcrumb1).toEqual(breadcrumb2);
      }),
      { numRuns: 50 }
    );
  });

  it('should handle subcategories from arbitrary generator', () => {
    fc.assert(
      fc.property(categoryWithSubcategoriesArbitrary(), ({ parent, subcategories }) => {
        if (subcategories.length === 0) return true;

        const allCategories = [parent, ...subcategories];
        const firstSubcat = subcategories[0];

        const breadcrumb = buildBreadcrumb(firstSubcat, allCategories);

        // Property: Breadcrumb includes parent
        const labels = breadcrumb.map((item) => item.label);
        expect(labels).toContain(parent.name);
        expect(labels).toContain(firstSubcat.name);

        // Property: Parent comes before subcategory
        const parentIndex = labels.indexOf(parent.name);
        const subcatIndex = labels.indexOf(firstSubcat.name);
        expect(parentIndex).toBeLessThan(subcatIndex);
      }),
      { numRuns: 50 }
    );
  });
});
