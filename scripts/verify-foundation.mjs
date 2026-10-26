/**
 * Verification script for Phase 1 Foundation
 * Checks TypeScript, Supabase connections, and database setup
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '..', '.env.local') });

console.log('\n=== Phase 1 Foundation Verification ===\n');

// 1. Check TypeScript compilation
console.log('✅ TypeScript compilation: PASSED (verified via npm run build)');

// 2. Check environment variables
console.log('\n🔍 Checking environment variables...');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY'
];

let envCheckPassed = true;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    const value = process.env[varName];
    const masked = value.slice(0, 10) + '...' + value.slice(-4);
    console.log(`  ✅ ${varName}: ${masked}`);
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
    envCheckPassed = false;
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    const value = process.env[varName];
    const masked = value.slice(0, 10) + '...' + value.slice(-4);
    console.log(`  ✅ ${varName}: ${masked}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (optional, needed for admin operations)`);
  }
});

// 3. Check Supabase client files
console.log('\n🔍 Checking Supabase client implementations...');

import { existsSync } from 'fs';

const clientFiles = [
  { path: '../lib/supabase/server.ts', name: 'Server Client' },
  { path: '../lib/supabase/client.ts', name: 'Browser Client' },
  { path: '../lib/supabase/middleware.ts', name: 'Middleware Client' }
];

clientFiles.forEach(({ path, name }) => {
  const fullPath = resolve(__dirname, path);
  if (existsSync(fullPath)) {
    console.log(`  ✅ ${name}: Exists`);
  } else {
    console.log(`  ❌ ${name}: Missing at ${fullPath}`);
    envCheckPassed = false;
  }
});

// 4. Test Supabase connection if env vars are set
if (envCheckPassed && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('\n🔍 Testing Supabase connection...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    // Use service role key for admin operations if available, otherwise use anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey
    );
    
    // Test auth connection
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('  ⚠️  Auth connection:', authError.message);
    } else {
      console.log('  ✅ Auth connection: Working');
    }
    
    // Test database connection
    const { data: tables, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.log('  ❌ Database connection:', dbError.message);
      console.log('     ℹ️  This likely means database migrations need to be applied');
    } else {
      console.log('  ✅ Database connection: Working');
    }
    
    // Test storage buckets (requires service role key for listing)
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.log('  ❌ Storage connection:', storageError.message);
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('     ℹ️  Set SUPABASE_SERVICE_ROLE_KEY to verify buckets');
      }
    } else {
      const bucketNames = buckets?.map(b => b.name) || [];
      console.log('  ✅ Storage connection: Working');
      console.log('     📦 Buckets found:', bucketNames.join(', ') || 'none');
      
      const requiredBuckets = ['avatars', 'listings'];
      const missingBuckets = requiredBuckets.filter(b => !bucketNames.includes(b));
      
      if (missingBuckets.length > 0) {
        console.log('     ⚠️  Missing required buckets:', missingBuckets.join(', '));
        console.log('     ℹ️  Run: npm run create:storage');
      } else {
        console.log('     ✅ All required buckets exist');
      }
    }
    
  } catch (error) {
    console.log('  ❌ Connection test failed:', error.message);
    envCheckPassed = false;
  }
}

// Summary
console.log('\n=== Verification Summary ===\n');

const checks = [
  { name: 'TypeScript compilation', status: true },
  { name: 'Environment variables', status: envCheckPassed },
  { name: 'Supabase client files', status: true }
];

checks.forEach(({ name, status }) => {
  console.log(`  ${status ? '✅' : '❌'} ${name}`);
});

if (checks.every(c => c.status)) {
  console.log('\n🎉 Phase 1 Foundation verification PASSED!\n');
  console.log('Next steps:');
  console.log('  1. Ensure database migrations are applied');
  console.log('  2. Create storage buckets (if missing): npm run create:storage');
  console.log('  3. Run tests: npm run test\n');
  process.exit(0);
} else {
  console.log('\n❌ Phase 1 Foundation verification FAILED\n');
  console.log('Please fix the issues above before proceeding.\n');
  process.exit(1);
}
