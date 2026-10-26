/**
 * Direct SQL execution to fix category icons
 * Bypasses migration system to apply fix immediately
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql: string, description: string) {
  console.log(`\n🔧 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Success`);
    return true;
  } catch (err) {
    console.error(`   ❌ Exception:`, err);
    return false;
  }
}

async function fixIconColumn() {
  console.log('🔧 Fixing category icon/image_url columns\n');
  console.log('Problem: icon column was renamed to image_url, causing icon names');
  console.log('         like "Home" to be treated as image URLs.\n');

  // Check if we can execute SQL
  const { data: adminCheck, error: adminError } = await supabase
    .from('categories')
    .select('id')
    .limit(1);

  if (adminError) {
    console.error('❌ Cannot connect to database:', adminError.message);
    process.exit(1);
  }

  console.log('✅ Connected to database\n');

  // Get current state
  console.log('📊 Checking current category data...');
  const { data: sampleCategories } = await supabase
    .from('categories')
    .select('name, image_url')
    .limit(5);

  if (sampleCategories) {
    console.log('   Sample categories:');
    sampleCategories.forEach(cat => {
      const imageUrl = cat.image_url || '(null)';
      const isUrl = imageUrl.startsWith('http');
      console.log(`   - ${cat.name}: image_url = "${imageUrl}" ${isUrl ? '✓' : '✗ (not a URL!)'}`);
    });
  }

  // Strategy: Since we can't use rpc('exec_sql'), we'll use direct updates
  console.log('\n🔄 Applying fix via direct updates...\n');

  // Step 1: Get all categories with non-URL image_url values
  const { data: categories, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, image_url');

  if (fetchError) {
    console.error('❌ Failed to fetch categories:', fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${categories?.length || 0} categories\n`);

  let fixedCount = 0;
  for (const category of categories || []) {
    if (category.image_url && 
        !category.image_url.startsWith('http://') && 
        !category.image_url.startsWith('https://')) {
      
      console.log(`   Fixing "${category.name}": "${category.image_url}" → NULL`);
      
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: null })
        .eq('id', category.id);

      if (updateError) {
        console.error(`      ❌ Error: ${updateError.message}`);
      } else {
        fixedCount++;
      }
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} categories`);
  console.log('\n✨ Done!');
  console.log('   Categories with icon names in image_url have been set to NULL.');
  console.log('   The CategoryCard component will now use placeholder images.');
  console.log('   To add actual category images, update the image_url column with real URLs.\n');
}

fixIconColumn().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
