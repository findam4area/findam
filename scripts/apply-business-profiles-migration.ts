/**
 * Apply Business Profiles Migration Script
 * This script applies migration 042 to create the business_profiles table
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   APPLYING BUSINESS PROFILES MIGRATION (042)              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '042_business_profiles_complete.sql');
  
  console.log(`📄 Reading migration file: ${migrationPath}\n`);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📤 Executing migration SQL...\n');
  
  // Execute the migration using the REST API
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: migrationSQL })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!\n');
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...\n');
    
    const { data, error } = await supabase
      .from('business_profiles')
      .select('id')
      .limit(0);
    
    if (error && !error.message.includes('limit')) {
      console.error('❌ Verification failed:', error.message);
      console.log('\n⚠️  The migration may have been applied but table verification failed.');
      console.log('   This could be due to RLS policies or permissions.\n');
    } else {
      console.log('✅ business_profiles table verified!\n');
    }
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              MIGRATION COMPLETED SUCCESSFULLY             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('❌ Error executing migration:', error);
    console.log('\n💡 Trying alternative approach using Supabase SQL editor...\n');
    
    // Alternative: try executing in smaller chunks
    console.log('📝 Please manually apply the migration using Supabase SQL Editor:');
    console.log(`   1. Open ${SUPABASE_URL}/project/_/sql`);
    console.log(`   2. Copy the contents of: ${migrationPath}`);
    console.log('   3. Execute the SQL in the editor\n');
    
    process.exit(1);
  }
}

applyMigration().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
