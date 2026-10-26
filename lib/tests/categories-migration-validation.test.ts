/**
 * Migration 041 Validation Tests
 * Task 1.1: Validate database migration for categories table with translations support
 * Requirements: 1.1, 1.2, 1.3, 1.5, 21.1, 21.2, 21.3
 * 
 * NOTE: These tests require a live Supabase database connection with write permissions.
 * They should be run in CI/CD with proper test database setup, not in local development.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe.skip('Task 1.1: Categories Table Migration Validation (REQUIRES LIVE DB)', () => {
  let supabase: SupabaseClient;
  let testCategoryId: string;
  let testSubcategoryId: string;

  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not set');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  });

  afterAll(async () => {
    // Cleanup: Delete test categories
    if (testSubcategoryId) {
      await supabase.from('categories').delete().eq('id', testSubcategoryId);
    }
    if (testCategoryId) {
      await supabase.from('categories').delete().eq('id', testCategoryId);
    }
  });

  it('should create a main category with multi-language translations', async () => {
    const mainCategory = {
      name: 'Test Category',
      name_translations: {
        yo: 'Ẹka Idanwo',
        ig: 'Otu Nnwale',
        ha: 'Rukunin Gwaji'
      },
      description: 'A test category for migration validation',
      description_translations: {
        yo: 'Ẹka idanwo fun iṣeduro gbigbe',
        ig: 'Otu nnwale maka nkwado mbugharị',
        ha: 'Rukunin gwaji don tabbatar da ƙaura'
      },
      icon: 'test-icon',
      display_order: 999
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(mainCategory)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('Test Category');
    expect(data.name_translations).toEqual(mainCategory.name_translations);
    expect(data.parent_id).toBeNull();
    expect(data.is_hidden).toBe(false);
    expect(data.created_at).toBeDefined();
    expect(data.updated_at).toBeDefined();

    testCategoryId = data.id;
  });

  it('should create a subcategory with parent relationship', async () => {
    expect(testCategoryId).toBeDefined();

    const subcategory = {
      name: 'Test Subcategory',
      name_translations: {
        yo: 'Abẹ-ẹka Idanwo',
        ig: 'Obere Otu Nnwale',
        ha: 'Ƙaramin Rukunin Gwaji'
      },
      description: 'A test subcategory',
      icon: 'test-sub-icon',
      parent_id: testCategoryId,
      display_order: 1
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(subcategory)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.parent_id).toBe(testCategoryId);
    expect(data.name).toBe('Test Subcategory');

    testSubcategoryId = data.id;
  });

  it('should enforce unique constraint on (name, parent_id)', async () => {
    expect(testCategoryId).toBeDefined();

    // Try to create duplicate subcategory with same name and parent
    const duplicate = {
      name: 'Test Subcategory',
      icon: 'duplicate-icon',
      parent_id: testCategoryId,
      display_order: 2
    };

    const { error } = await supabase
      .from('categories')
      .insert(duplicate);

    expect(error).toBeDefined();
    expect(error?.message).toContain('unique');
  });

  it('should allow same name for different parent levels', async () => {
    // Create another main category with same name as subcategory
    const mainCategoryWithSubName = {
      name: 'Test Subcategory', // Same as existing subcategory name
      icon: 'same-name-icon',
      parent_id: null, // Different level (main category)
      display_order: 998
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(mainCategoryWithSubName)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.name).toBe('Test Subcategory');
    expect(data.parent_id).toBeNull();

    // Cleanup
    if (data?.id) {
      await supabase.from('categories').delete().eq('id', data.id);
    }
  });

  it('should automatically update updated_at timestamp on update', async () => {
    expect(testCategoryId).toBeDefined();

    // Get original timestamp
    const { data: original } = await supabase
      .from('categories')
      .select('updated_at')
      .eq('id', testCategoryId)
      .single();

    expect(original).toBeDefined();
    const originalTimestamp = original!.updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the category
    const { data: updated, error } = await supabase
      .from('categories')
      .update({ description: 'Updated description' })
      .eq('id', testCategoryId)
      .select('updated_at')
      .single();

    expect(error).toBeNull();
    expect(updated).toBeDefined();
    expect(new Date(updated!.updated_at).getTime())
      .toBeGreaterThan(new Date(originalTimestamp).getTime());
  });

  it('should cascade delete subcategories when parent is deleted', async () => {
    expect(testCategoryId).toBeDefined();
    expect(testSubcategoryId).toBeDefined();

    // Verify subcategory exists
    const { data: subBefore } = await supabase
      .from('categories')
      .select('id')
      .eq('id', testSubcategoryId)
      .single();

    expect(subBefore).toBeDefined();

    // Delete parent category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', testCategoryId);

    expect(deleteError).toBeNull();

    // Verify subcategory is also deleted (CASCADE)
    const { data: subAfter } = await supabase
      .from('categories')
      .select('id')
      .eq('id', testSubcategoryId)
      .single();

    expect(subAfter).toBeNull();

    // Clear IDs since they're deleted
    testCategoryId = '';
    testSubcategoryId = '';
  });

  it('should support querying main categories (parent_id IS NULL)', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('display_order', { ascending: true })
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    
    // Verify all returned items are main categories
    data!.forEach(category => {
      expect(category.parent_id).toBeNull();
    });
  });

  it('should support querying subcategories for a parent', async () => {
    // Find any existing main category
    const { data: mainCategories } = await supabase
      .from('categories')
      .select('id')
      .is('parent_id', null)
      .limit(1);

    if (mainCategories && mainCategories.length > 0) {
      const parentId = mainCategories[0].id;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .order('display_order', { ascending: true });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      // Verify all returned items are subcategories of the parent
      data!.forEach(category => {
        expect(category.parent_id).toBe(parentId);
      });
    }
  });

  it('should support filtering by is_hidden flag', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_hidden', false)
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);

    // Verify all returned categories are not hidden
    data!.forEach(category => {
      expect(category.is_hidden).toBe(false);
    });
  });
});
