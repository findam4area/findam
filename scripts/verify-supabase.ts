/**
 * Verification script for Supabase connections
 * Tests server, client, and middleware implementations
 */

import { createClient as createServerClient } from '../lib/supabase/server';
import { createClient as createBrowserClient } from '../lib/supabase/client';

async function verifyServerClient() {
  console.log('🔍 Verifying server client...');
  try {
    const supabase = await createServerClient();
    
    // Test basic query
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Server client error:', error.message);
      return false;
    }
    
    console.log('✅ Server client: Connected and working');
    return true;
  } catch (error) {
    console.error('❌ Server client exception:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function verifyClientClient() {
  console.log('🔍 Verifying browser client...');
  try {
    const supabase = createBrowserClient();
    
    // Test auth state
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Browser client error:', error.message);
      return false;
    }
    
    console.log('✅ Browser client: Connected and working');
    return true;
  } catch (error) {
    console.error('❌ Browser client exception:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function verifyStorageBuckets() {
  console.log('🔍 Verifying storage buckets...');
  try {
    const supabase = await createServerClient();
    
    // List buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Storage error:', error.message);
      return false;
    }
    
    console.log('📦 Available buckets:', buckets?.map(b => b.name).join(', ') || 'none');
    
    // Check for required buckets
    const requiredBuckets = ['avatars', 'listings'];
    const existingBuckets = buckets?.map(b => b.name) || [];
    const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));
    
    if (missingBuckets.length > 0) {
      console.warn('⚠️  Missing buckets:', missingBuckets.join(', '));
      console.log('ℹ️  These buckets need to be created in Supabase dashboard');
      return false;
    }
    
    console.log('✅ Storage buckets: All required buckets exist');
    return true;
  } catch (error) {
    console.error('❌ Storage exception:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function verifyDatabase() {
  console.log('🔍 Verifying database tables...');
  try {
    const supabase = await createServerClient();
    
    // Test required tables
    const requiredTables = [
      'users',
      'categories',
      'listings',
      'vendor_applications',
      'approved_vendors'
    ];
    
    const results = await Promise.all(
      requiredTables.map(async (table) => {
        const { error } = await supabase.from(table).select('count').limit(1);
        return { table, exists: !error };
      })
    );
    
    const missingTables = results.filter(r => !r.exists).map(r => r.table);
    
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables.join(', '));
      console.log('ℹ️  Database migrations need to be applied');
      return false;
    }
    
    console.log('✅ Database: All required tables exist');
    return true;
  } catch (error) {
    console.error('❌ Database exception:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log('\n=== Supabase Connection Verification ===\n');
  
  const results = await Promise.all([
    verifyServerClient(),
    verifyClientClient(),
    verifyStorageBuckets(),
    verifyDatabase()
  ]);
  
  const allPassed = results.every(r => r === true);
  
  console.log('\n=== Verification Summary ===\n');
  
  if (allPassed) {
    console.log('✅ All checks passed! Foundation is complete.');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please review the errors above.');
    process.exit(1);
  }
}

main();
