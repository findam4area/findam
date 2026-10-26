/**
 * Admin API endpoint for bulk category import via CSV
 * 
 * POST /api/admin/categories/import
 * 
 * Accepts CSV data in request body, validates it, and inserts or updates categories
 * in the database. When a category with the same name and parent_id exists, it will
 * be updated with the new values. Requires admin authentication.
 * 
 * Requirements: 19.1, 19.2, 19.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/auth/admin';
import { parseCSVToCategories } from '@/lib/parsers';

interface CategoryInsert {
  name: string;
  description: string | null;
  icon: string;
  parent_id: string | null;
  display_order: number;
  is_hidden: boolean;
}

interface ImportResponse {
  success: boolean;
  summary: {
    total_categories: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  errors?: Array<{
    line: number;
    error: string;
  }>;
  inserted_categories?: Array<{
    id: string;
    name: string;
  }>;
  updated_categories?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * POST /api/admin/categories/import
 * 
 * Import categories from CSV data
 * 
 * Request body:
 * {
 *   csv_data: string  // CSV content as string
 * }
 * 
 * CSV Format:
 * name,parent_id,display_order,description,icon
 * 
 * Returns:
 * {
 *   success: boolean
 *   summary: { total_categories, inserted, updated, skipped, errors }
 *   errors?: [...] // Validation/insertion errors
 *   inserted_categories?: [...] // Successfully inserted categories
 *   updated_categories?: [...] // Successfully updated categories
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const authCheck = await checkAdminAuth(supabase);

    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { csv_data } = body;

    if (!csv_data || typeof csv_data !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid csv_data field in request body' },
        { status: 400 }
      );
    }

    // Validate CSV data
    const parseResult = parseCSVToCategories(csv_data);

    if (!parseResult.success) {
      return NextResponse.json<ImportResponse>(
        {
          success: false,
          summary: {
            total_categories: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
            errors: parseResult.errors.length,
          },
          errors: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Get existing categories to check for duplicates
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name, parent_id');

    const existingCategoryMap = new Map<string, { id: string; parent_id: string | null }>();
    existingCategories?.forEach((cat) => {
      // Key by name and parent_id to handle main categories vs subcategories
      const key = `${cat.name}||${cat.parent_id || 'NULL'}`;
      existingCategoryMap.set(key, { id: cat.id, parent_id: cat.parent_id });
    });

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const insertionErrors: Array<{ line: number; error: string }> = [];
    const insertedCategories: Array<{ id: string; name: string }> = [];
    const updatedCategories: Array<{ id: string; name: string }> = [];
    const parentIdMap = new Map<string, string>();

    // First pass: Insert or update main categories (parent_id is null)
    const mainCategories = parseResult.categories.filter((cat) => !cat.parent_id);
    const subCategories = parseResult.categories.filter((cat) => cat.parent_id);

    for (let i = 0; i < mainCategories.length; i++) {
      const category = mainCategories[i];
      const lineNumber = i + 2; // +2 for header and 0-based index

      // Create a key for looking up existing categories
      const existingKey = `${category.name}||NULL`;
      const existing = existingCategoryMap.get(existingKey);

      if (existing) {
        // Category exists - update it
        const categoryUpdate = {
          description: category.description || null,
          icon: category.icon || '',
          display_order: category.display_order,
          // Preserve is_hidden value (don't override it)
        };

        const { data, error } = await supabase
          .from('categories')
          .update(categoryUpdate)
          .eq('id', existing.id)
          .select('id, name')
          .single();

        if (error) {
          errorCount++;
          insertionErrors.push({
            line: lineNumber,
            error: `Failed to update "${category.name}": ${error.message}`,
          });
        } else {
          updatedCount++;
          updatedCategories.push(data);
          parentIdMap.set(category.name, data.id);
        }
      } else {
        // Category doesn't exist - insert it
        const categoryInsert: CategoryInsert = {
          name: category.name,
          description: category.description || null,
          icon: category.icon || '',
          parent_id: null,
          display_order: category.display_order,
          is_hidden: false,
        };

        const { data, error } = await supabase
          .from('categories')
          .insert(categoryInsert)
          .select('id, name')
          .single();

        if (error) {
          errorCount++;
          insertionErrors.push({
            line: lineNumber,
            error: `Failed to insert "${category.name}": ${error.message}`,
          });
        } else {
          insertedCount++;
          insertedCategories.push(data);
          parentIdMap.set(category.name, data.id);
        }
      }
    }

    // Refresh existing categories after main category insertion/updates
    const { data: updatedCategoriesData } = await supabase
      .from('categories')
      .select('id, name, parent_id');

    const updatedCategoryMap = new Map<string, { id: string; parent_id: string | null }>();
    updatedCategoriesData?.forEach((cat) => {
      const key = `${cat.name}||${cat.parent_id || 'NULL'}`;
      updatedCategoryMap.set(key, { id: cat.id, parent_id: cat.parent_id });
    });

    // Second pass: Insert or update subcategories
    for (let i = 0; i < subCategories.length; i++) {
      const category = subCategories[i];
      const lineNumber = mainCategories.length + i + 2;

      // Get parent ID
      const parentId = category.parent_id 
        ? (parentIdMap.get(category.parent_id) || updatedCategoryMap.get(`${category.parent_id}||NULL`)?.id || null)
        : null;

      if (!parentId && category.parent_id) {
        errorCount++;
        insertionErrors.push({
          line: lineNumber,
          error: `Parent category "${category.parent_id}" not found for "${category.name}"`,
        });
        continue;
      }

      // Check if subcategory exists (name + parent_id combination)
      const existingKey = `${category.name}||${parentId}`;
      const existing = updatedCategoryMap.get(existingKey);

      if (existing) {
        // Subcategory exists - update it
        const categoryUpdate = {
          description: category.description || null,
          icon: category.icon || '',
          display_order: category.display_order,
          // Preserve is_hidden value
        };

        const { data, error } = await supabase
          .from('categories')
          .update(categoryUpdate)
          .eq('id', existing.id)
          .select('id, name')
          .single();

        if (error) {
          errorCount++;
          insertionErrors.push({
            line: lineNumber,
            error: `Failed to update "${category.name}": ${error.message}`,
          });
        } else {
          updatedCount++;
          updatedCategories.push(data);
        }
      } else {
        // Subcategory doesn't exist - insert it
        const categoryInsert: CategoryInsert = {
          name: category.name,
          description: category.description || null,
          icon: category.icon || '',
          parent_id: parentId,
          display_order: category.display_order,
          is_hidden: false,
        };

        const { data, error } = await supabase
          .from('categories')
          .insert(categoryInsert)
          .select('id, name')
          .single();

        if (error) {
          errorCount++;
          insertionErrors.push({
            line: lineNumber,
            error: `Failed to insert "${category.name}": ${error.message}`,
          });
        } else {
          insertedCount++;
          insertedCategories.push(data);
        }
      }
    }

    const response: ImportResponse = {
      success: errorCount === 0,
      summary: {
        total_categories: parseResult.categories.length,
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      errors: insertionErrors.length > 0 ? insertionErrors : undefined,
      inserted_categories: insertedCategories.length > 0 ? insertedCategories : undefined,
      updated_categories: updatedCategories.length > 0 ? updatedCategories : undefined,
    };

    return NextResponse.json(response, {
      status: errorCount > 0 ? 207 : 200, // 207 Multi-Status for partial success
    });

  } catch (error) {
    console.error('Error importing categories:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
