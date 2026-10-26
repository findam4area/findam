/**
 * Script to seed categories into the database
 * 
 * This script loads category data from categories-seed.ts and inserts them
 * into the categories table with proper parent-child relationships.
 * 
 * Features:
 * - Idempotent execution (skips existing categories)
 * - Inserts main categories first, then subcategories
 * - Maintains proper parent references
 * - Handles transactions for data consistency
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

interface CategoryRecord {
  id: string;
  name: string;
}

/**
 * Check if categories table exists and has data
 */
async function checkExistingCategories(): Promise<{ exists: boolean; count: number }> {
  try {
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error checking categories table:', error.message);
      return { exists: false, count: 0 };
    }

    return { exists: true, count: count || 0 };
  } catch (err) {
    return { exists: false, count: 0 };
  }
}

/**
 * Get existing categories from database
 */
async function getExistingCategories(): Promise<Map<string, CategoryRecord>> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name');

  if (error) {
    throw new Error(`Failed to fetch existing categories: ${error.message}`);
  }

  const categoryMap = new Map<string, CategoryRecord>();
  
  if (data) {
    data.forEach((cat) => {
      categoryMap.set(cat.name, cat);
    });
  }

  return categoryMap;
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
  console.log('🌱 Seeding categories into database...\n');

  // Check if categories table exists and has data
  const { exists, count } = await checkExistingCategories();
  
  if (!exists) {
    console.error('❌ Categories table does not exist or is not accessible');
    console.error('   Please run the database migrations first');
    return false;
  }

  console.log(`📊 Current categories in database: ${count}`);

  if (count > 0) {
    console.log('⚠️  Categories already exist. Checking for new categories to add...\n');
  }

  // Get existing categories
  const existingCategories = await getExistingCategories();
  console.log(`📝 Found ${existingCategories.size} existing categories\n`);

  let mainInserted = 0;
  let mainSkipped = 0;
  let mainErrors = 0;
  let subInserted = 0;
  let subSkipped = 0;
  let subErrors = 0;

  // Track parent IDs for subcategory insertion
  const parentIdMap = new Map<string, string>();

  // First pass: Insert all main categories
  console.log('� Inserting main categories...\n');
  
  for (const category of categoriesSeed) {
    // Check if category already exists
    if (existingCategories.has(category.name)) {
      console.log(`⏭️  Main category "${category.name}" already exists, skipping...`);
      const existing = existingCategories.get(category.name)!;
      parentIdMap.set(category.name, existing.id);
      mainSkipped++;
      continue;
    }

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
  console.log(`   - Skipped: ${mainSkipped}`);
  console.log(`   - Errors: ${mainErrors}\n`);

  // Refresh existing categories after main category insertion
  const updatedCategories = await getExistingCategories();

  // Second pass: Insert all subcategories
  console.log('� Inserting subcategories...\n');

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
      // Check if subcategory already exists
      if (updatedCategories.has(subcategory.name)) {
        console.log(`   ⏭️  "${subcategory.name}" already exists, skipping...`);
        subSkipped++;
        continue;
      }

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
  console.log(`   - Skipped: ${subSkipped}`);
  console.log(`   - Errors: ${subErrors}\n`);

  const totalInserted = mainInserted + subInserted;
  const totalSkipped = mainSkipped + subSkipped;
  const totalErrors = mainErrors + subErrors;

  console.log(`📈 Overall summary:`);
  console.log(`   - Total inserted: ${totalInserted}`);
  console.log(`   - Total skipped: ${totalSkipped}`);
  console.log(`   - Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log('\n⚠️  Some categories failed to insert.');
    return false;
  }

  if (totalInserted > 0 || totalSkipped > 0) {
    console.log('\n✅ Category seeding completed successfully!');
    return true;
  }

  return false;
}

// Run seeding
seedCategories()
  .then((success) => {
    console.log('\n💡 Next steps:');
    console.log('   1. Verify categories: Check your database for the categories table');
    console.log('   2. Test category API endpoints');
    console.log('   3. Start building business profiles with category associations');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
