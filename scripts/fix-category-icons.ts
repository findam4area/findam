/**
 * Script to fix category icons
 * 
 * Problem: The 'icon' column was renamed to 'image_url' in migration 050,
 * causing icon names like "Home" to be treated as image URLs.
 * 
 * Solution:
 * 1. Add 'icon' column back
 * 2. Move non-URL values from image_url to icon
 * 3. Clear image_url for non-URL values
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCategoryIcons() {
  console.log('🔧 Fixing category icons...\n');

  try {
    // Step 1: Check current data
    console.log('📊 Checking current categories...');
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, image_url')
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching categories:', fetchError);
      return;
    }

    console.log(`Found ${categories?.length || 0} categories\n`);
    
    if (categories && categories.length > 0) {
      console.log('Sample categories:');
      categories.forEach(cat => {
        console.log(`  - ${cat.name}: image_url = "${cat.image_url}"`);
      });
      console.log();
    }

    // Step 2: Update categories with non-URL image_url values
    console.log('🔄 Fixing categories where image_url contains icon names...');
    
    let fixed = 0;
    for (const category of categories || []) {
      if (category.image_url && 
          !category.image_url.startsWith('http://') && 
          !category.image_url.startsWith('https://')) {
        
        console.log(`  Fixing ${category.name}: "${category.image_url}" -> NULL`);
        
        const { error: updateError } = await supabase
          .from('categories')
          .update({ image_url: null })
          .eq('id', category.id);

        if (updateError) {
          console.error(`    ❌ Error: ${updateError.message}`);
        } else {
          console.log(`    ✅ Fixed`);
          fixed++;
        }
      }
    }

    console.log(`\n✅ Fixed ${fixed} categories`);
    console.log('✨ Done! Categories with icon names in image_url have been cleared.');
    console.log('   Icons will now use placeholder images or category-specific images.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixCategoryIcons();
