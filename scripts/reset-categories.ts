/**
 * Script to reset categories in the database
 * 
 * This script:
 * 1. Deletes all existing categories from the database
 * 2. Reseeds fresh category data from categories-seed.ts
 * 
 * WARNING: This will delete all existing categories and any associated data!
 * Use with caution in production environments.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { createClient } from '@supabase/supabase-js';
import { categoriesSeed } from '../data/categories-seed';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface CategoryInsert {
  name: string;
  description: string;
  icon: string;
  parent_id: string | null;
  display_order: number;
  is_hidden: boolean;
}

/**
 * Delete all existing categories
 */
async function deleteAllCategories(): Promise<number> {
  console.log('🗑️  Deleting all existing categories...\n');

  // First, get count of existing categories
  const { count: beforeCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Found ${beforeCount || 0} categories to delete`);

  if (beforeCount === 0) {
    console.log('   No categories to delete\n');
    return 0;
  }

  // Delete all categories (subcategories will be deleted via CASCADE)
  const { error, count } = await supabase
    .from('categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (dummy condition)

  if (error) {
    console.error(`   ❌ Error deleting categories: ${error.message}`);
    throw new Error(`Failed to delete categories: ${error.message}`);
  }

  console.log(`   ✅ Deleted ${beforeCount} categories\n`);
  return beforeCount || 0;
}

/**
 * Insert a single category
 */
async function insertCategory(category: CategoryInsert): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select('id, name')
    .single();

  if (error) {
    console.error(`   ❌ Error inserting "${category.name}": ${error.message}`);
    return null;
  }

  return data;
}

/**
 * Seed all categories into the database
 */
async function seedCategories() {
  console.log('🌱 Seeding fresh categories into database...\n');

  let mainInserted = 0;
  let mainErrors = 0;
  let subInserted = 0;
  let subErrors = 0;

  // Track parent IDs for subcategory insertion
  const parentIdMap = new Map<string, string>();

  // First pass: Insert all main categories
  console.log('🔹 Inserting main categories...\n');
  
  for (const category of categoriesSeed) {
    console.log(`📦 Inserting main category: ${category.name}`);

    const categoryInsert: CategoryInsert = {
      name: category.name,
      description: category.description,
      icon: category.icon,
      parent_id: null,
      display_order: category.display_order,
      is_hidden: false,
    };

    const result = await insertCategory(categoryInsert);

    if (result) {
      console.log(`   ✅ Inserted successfully (ID: ${result.id})`);
      parentIdMap.set(category.name, result.id);
      mainInserted++;
    } else {
      console.log(`   ❌ Failed to insert`);
      mainErrors++;
    }
  }

  console.log(`\n📊 Main categories summary:`);
  console.log(`   - Inserted: ${mainInserted}`);
  console.log(`   - Errors: ${mainErrors}\n`);

  if (mainErrors > 0) {
    console.error('❌ Failed to insert some main categories. Stopping...');
    return false;
  }

  // Second pass: Insert all subcategories
  console.log('🔸 Inserting subcategories...\n');

  for (const category of categoriesSeed) {
    if (!category.subcategories || category.subcategories.length === 0) {
      continue;
    }

    const parentId = parentIdMap.get(category.name);
    
    if (!parentId) {
      console.error(`❌ Parent category "${category.name}" not found, skipping subcategories`);
      subErrors += category.subcategories.length;
      continue;
    }

    console.log(`📂 Processing subcategories for: ${category.name}`);

    for (const subcategory of category.subcategories) {
      const subcategoryInsert: CategoryInsert = {
        name: subcategory.name,
        description: subcategory.description,
        icon: '', // Subcategories don't have icons
        parent_id: parentId,
        display_order: subcategory.display_order,
        is_hidden: false,
      };

      const result = await insertCategory(subcategoryInsert);

      if (result) {
        console.log(`   ✅ "${subcategory.name}" inserted`);
        subInserted++;
      } else {
        subErrors++;
      }
    }

    console.log('');
  }

  console.log(`📊 Subcategories summary:`);
  console.log(`   - Inserted: ${subInserted}`);
  console.log(`   - Errors: ${subErrors}\n`);

  const totalInserted = mainInserted + subInserted;
  const totalErrors = mainErrors + subErrors;

  console.log(`📈 Overall summary:`);
  console.log(`   - Total inserted: ${totalInserted}`);
  console.log(`   - Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log('\n⚠️  Some categories failed to insert.');
    return false;
  }

  console.log('\n✅ Category seeding completed successfully!');
  return true;
}

/**
 * Main reset function
 */
async function resetCategories() {
  console.log('🔄 RESETTING CATEGORIES DATABASE\n');
  console.log('⚠️  WARNING: This will delete all existing categories!\n');

  try {
    // Step 1: Delete all existing categories
    const deletedCount = await deleteAllCategories();
    console.log(`✅ Deleted ${deletedCount} categories\n`);

    // Step 2: Seed fresh categories
    const success = await seedCategories();

    return success;
  } catch (error) {
    console.error('❌ Reset failed:', error);
    return false;
  }
}

// Run reset
resetCategories()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Categories reset completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Verify categories in your database');
      console.log('   2. Test category API endpoints');
      console.log('   3. Start building business profiles with category associations');
    } else {
      console.log('\n❌ Categories reset failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
