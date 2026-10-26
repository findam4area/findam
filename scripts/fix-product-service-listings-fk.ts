/**
 * Fix Product and Service Listings Foreign Key Constraints
 * 
 * This script updates the foreign key constraints on product_listings and service_listings
 * tables to reference business_profiles instead of businesses table.
 */

import { createClient } from '@supabase/supabase-js';

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

async function fixForeignKeys() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   FIX PRODUCT/SERVICE LISTINGS FOREIGN KEY CONSTRAINTS     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('🔍 Checking current foreign key constraints...\n');

    // SQL to fix the foreign key constraints
    const fixSQL = `
-- Drop old constraints if they exist
ALTER TABLE IF EXISTS product_listings 
  DROP CONSTRAINT IF EXISTS product_listings_business_profile_id_fkey CASCADE;

ALTER TABLE IF EXISTS service_listings 
  DROP CONSTRAINT IF EXISTS service_listings_business_profile_id_fkey CASCADE;

-- Add correct constraints pointing to business_profiles
ALTER TABLE product_listings 
  ADD CONSTRAINT product_listings_business_profile_id_fkey 
  FOREIGN KEY (business_profile_id) 
  REFERENCES business_profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE service_listings 
  ADD CONSTRAINT service_listings_business_profile_id_fkey 
  FOREIGN KEY (business_profile_id) 
  REFERENCES business_profiles(id) 
  ON DELETE CASCADE;

-- Verify constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('product_listings', 'service_listings')
  AND kcu.column_name = 'business_profile_id';
`;

    console.log('📝 Applying foreign key fixes...\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: fixSQL }).single();

    if (error) {
      // If RPC doesn't work, we need to guide the user to run SQL manually
      console.log('⚠️  Cannot execute SQL directly via RPC\n');
      console.log('📋 Please run this SQL manually in Supabase SQL Editor:\n');
      console.log('─'.repeat(60));
      console.log(fixSQL);
      console.log('─'.repeat(60));
      console.log('\n💡 Steps:');
      console.log(`   1. Go to: ${supabaseUrl}/project/_/sql/new`);
      console.log('   2. Copy and paste the SQL above');
      console.log('   3. Click "Run"');
      console.log('   4. Re-run the seed script\n');
      return false;
    }

    console.log('✅ Foreign key constraints updated successfully!\n');
    console.log('📊 Verification:');
    if (data) {
      console.log(data);
    }
    
    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Run the fix
fixForeignKeys()
  .then((success) => {
    if (success) {
      console.log('\n✅ Fix applied successfully!');
      console.log('\n💡 Next step: Run the seed script again');
      console.log('   npx tsx scripts/seed-sample-businesses.ts\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
