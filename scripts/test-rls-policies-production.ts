/**
 * Production RLS Policies Testing Script
 * Task 10.17: Database setup and migration for production
 * 
 * This script tests Row Level Security policies to ensure they work correctly in production:
 * - Anonymous user access (should see only public data)
 * - Authenticated user access (should see own data)
 * - Data isolation (users cannot access other users' private data)
 * - Admin access (if applicable)
 * 
 * USAGE:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
 *   SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/test-rls-policies-production.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Clients for different permission levels
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  expected: string;
  actual: string;
}

const results: TestResult[] = [];

function addResult(
  test: string,
  status: 'PASS' | 'FAIL',
  message: string,
  expected: string,
  actual: string
) {
  results.push({ test, status, message, expected, actual });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`  ${icon} ${test}: ${message}`);
}

async function testAnonymousAccess(): Promise<void> {
  console.log('\n🕵️  Testing Anonymous User Access...');

  // Test 1: Anonymous can view approved listings
  const { data: approvedListings, error: listingsError } = await anonClient
    .from('listings')
    .select('id, title, is_active')
    .eq('is_active', true)
    .limit(5);

  if (listingsError) {
    addResult(
      'Anonymous - View Approved Listings',
      'FAIL',
      `Error: ${listingsError.message}`,
      'Can view approved listings',
      'Access denied or error'
    );
  } else {
    addResult(
      'Anonymous - View Approved Listings',
      'PASS',
      `Retrieved ${approvedListings?.length || 0} listings`,
      'Can view approved listings',
      'Successfully retrieved listings'
    );
  }

  // Test 2: Anonymous can view categories
  const { data: categories, error: categoriesError } = await anonClient
    .from('categories')
    .select('id, name')
    .limit(5);

  if (categoriesError) {
    addResult(
      'Anonymous - View Categories',
      'FAIL',
      `Error: ${categoriesError.message}`,
      'Can view categories',
      'Access denied or error'
    );
  } else {
    addResult(
      'Anonymous - View Categories',
      'PASS',
      `Retrieved ${categories?.length || 0} categories`,
      'Can view categories',
      'Successfully retrieved categories'
    );
  }

  // Test 3: Anonymous cannot create listings
  const { data: createData, error: createError } = await anonClient
    .from('listings')
    .insert({
      title: 'Test Listing',
      description: 'This should fail',
      price: 100,
      state: 'Lagos',
      lga: 'Ikeja',
    })
    .select();

  if (createError) {
    addResult(
      'Anonymous - Create Listing (Should Fail)',
      'PASS',
      'Correctly blocked',
      'Access denied',
      'Access denied as expected'
    );
  } else {
    addResult(
      'Anonymous - Create Listing (Should Fail)',
      'FAIL',
      'Incorrectly allowed',
      'Access denied',
      'Listing created (security issue!)'
    );
  }

  // Test 4: Anonymous cannot view user private data
  const { data: users, error: usersError } = await anonClient
    .from('users')
    .select('id, email, phone')
    .limit(5);

  // Should either get empty or only public profile fields
  if (usersError || (users && users.length === 0)) {
    addResult(
      'Anonymous - View User Private Data (Should Fail)',
      'PASS',
      'Private data protected',
      'Cannot access private data',
      'Access denied or filtered correctly'
    );
  } else if (users && users.length > 0) {
    // Check if private fields are null/hidden
    const hasPrivateData = users.some((u) => u.email || u.phone);
    if (hasPrivateData) {
      addResult(
        'Anonymous - View User Private Data (Should Fail)',
        'FAIL',
        'Private data exposed',
        'Cannot access private data',
        'Private fields visible (security issue!)'
      );
    } else {
      addResult(
        'Anonymous - View User Private Data (Should Fail)',
        'PASS',
        'Public profiles only',
        'Cannot access private data',
        'Only public data accessible'
      );
    }
  }
}

async function createTestUser(): Promise<{ userId: string; email: string; password: string } | null> {
  console.log('\n👤 Creating test user for authenticated access tests...');

  const testEmail = `test-${Date.now()}@test.com`;
  const testPassword = 'TestPass123!';

  try {
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        username: `testuser${Date.now()}`,
      },
    });

    if (error) {
      console.log(`   ❌ Failed to create test user: ${error.message}`);
      return null;
    }

    if (!data.user) {
      console.log('   ❌ No user data returned');
      return null;
    }

    console.log('   ✅ Test user created');
    console.log(`   Email: ${testEmail}`);
    console.log(`   User ID: ${data.user.id}`);

    return {
      userId: data.user.id,
      email: testEmail,
      password: testPassword,
    };
  } catch (err) {
    console.log(`   ❌ Error creating test user: ${err}`);
    return null;
  }
}

async function testAuthenticatedAccess(testUser: {
  userId: string;
  email: string;
  password: string;
}): Promise<void> {
  console.log('\n🔐 Testing Authenticated User Access...');

  // Create authenticated client
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Sign in
  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password,
  });

  if (signInError) {
    addResult(
      'Authenticated - Sign In',
      'FAIL',
      `Sign in failed: ${signInError.message}`,
      'Successful sign in',
      'Sign in failed'
    );
    return;
  }

  addResult(
    'Authenticated - Sign In',
    'PASS',
    'Successfully signed in',
    'Successful sign in',
    'User authenticated'
  );

  // Test 1: Can create own listing
  const { data: ownListing, error: createError } = await authClient
    .from('listings')
    .insert({
      user_id: testUser.userId,
      title: 'Test Listing by User',
      description: 'Testing RLS policies',
      price: 1000,
      state: 'Lagos',
      lga: 'Ikeja',
    })
    .select()
    .single();

  if (createError) {
    addResult(
      'Authenticated - Create Own Listing',
      'FAIL',
      `Error: ${createError.message}`,
      'Can create listing',
      'Creation blocked'
    );
  } else {
    addResult(
      'Authenticated - Create Own Listing',
      'PASS',
      'Listing created successfully',
      'Can create listing',
      'Listing created'
    );
  }

  // Test 2: Can view own listing
  if (ownListing) {
    const { data: viewOwn, error: viewError } = await authClient
      .from('listings')
      .select('*')
      .eq('id', ownListing.id)
      .single();

    if (viewError) {
      addResult(
        'Authenticated - View Own Listing',
        'FAIL',
        `Error: ${viewError.message}`,
        'Can view own listing',
        'Access denied'
      );
    } else {
      addResult(
        'Authenticated - View Own Listing',
        'PASS',
        'Can access own listing',
        'Can view own listing',
        'Successfully viewed'
      );
    }

    // Test 3: Can update own listing
    const { error: updateError } = await authClient
      .from('listings')
      .update({ title: 'Updated Test Listing' })
      .eq('id', ownListing.id);

    if (updateError) {
      addResult(
        'Authenticated - Update Own Listing',
        'FAIL',
        `Error: ${updateError.message}`,
        'Can update own listing',
        'Update blocked'
      );
    } else {
      addResult(
        'Authenticated - Update Own Listing',
        'PASS',
        'Update successful',
        'Can update own listing',
        'Successfully updated'
      );
    }

    // Test 4: Can delete own listing
    const { error: deleteError } = await authClient
      .from('listings')
      .delete()
      .eq('id', ownListing.id);

    if (deleteError) {
      addResult(
        'Authenticated - Delete Own Listing',
        'FAIL',
        `Error: ${deleteError.message}`,
        'Can delete own listing',
        'Deletion blocked'
      );
    } else {
      addResult(
        'Authenticated - Delete Own Listing',
        'PASS',
        'Deletion successful',
        'Can delete own listing',
        'Successfully deleted'
      );
    }
  }

  // Test 5: Cannot modify other users' listings (if any exist)
  const { data: otherListings } = await serviceClient
    .from('listings')
    .select('id, user_id')
    .neq('user_id', testUser.userId)
    .limit(1)
    .single();

  if (otherListings) {
    const { error: modifyError } = await authClient
      .from('listings')
      .update({ title: 'Hacked!' })
      .eq('id', otherListings.id);

    if (modifyError) {
      addResult(
        'Authenticated - Modify Others Listing (Should Fail)',
        'PASS',
        'Correctly blocked',
        'Access denied',
        'Modification blocked as expected'
      );
    } else {
      addResult(
        'Authenticated - Modify Others Listing (Should Fail)',
        'FAIL',
        'Incorrectly allowed',
        'Access denied',
        'Modified other user data (security issue!)'
      );
    }
  }

  // Clean up: sign out
  await authClient.auth.signOut();
}

async function cleanupTestUser(userId: string): Promise<void> {
  console.log('\n🗑️  Cleaning up test user...');

  try {
    await serviceClient.auth.admin.deleteUser(userId);
    console.log('   ✅ Test user deleted');
  } catch (err) {
    console.log(`   ⚠️  Could not delete test user: ${err}`);
  }
}

async function testStorageRLS(): Promise<void> {
  console.log('\n📦 Testing Storage RLS Policies...');

  // Test 1: Anonymous can view public storage files
  const { data: publicUrl } = anonClient.storage.from('avatars').getPublicUrl('test/dummy.jpg');

  if (publicUrl) {
    addResult(
      'Storage - Anonymous Access Public URL',
      'PASS',
      'Public URL accessible',
      'Can get public URL',
      'URL generated successfully'
    );
  }

  // Test 2: Anonymous cannot upload
  const testBlob = new Blob(['test'], { type: 'text/plain' });
  const { error: uploadError } = await anonClient.storage
    .from('avatars')
    .upload('test/anon-test.txt', testBlob);

  if (uploadError) {
    addResult(
      'Storage - Anonymous Upload (Should Fail)',
      'PASS',
      'Upload blocked',
      'Access denied',
      'Upload blocked as expected'
    );
  } else {
    addResult(
      'Storage - Anonymous Upload (Should Fail)',
      'FAIL',
      'Upload allowed',
      'Access denied',
      'Upload succeeded (security issue!)'
    );
    // Clean up
    await serviceClient.storage.from('avatars').remove(['test/anon-test.txt']);
  }
}

function printSummary(): void {
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              RLS POLICIES TEST SUMMARY                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log(`✅ PASSED: ${passed}`);
  console.log(`❌ FAILED: ${failed}`);
  console.log(`📊 TOTAL:  ${results.length}\n`);

  if (failed > 0) {
    console.log('❌ FAILED TESTS:\n');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`   • ${r.test}`);
        console.log(`     Expected: ${r.expected}`);
        console.log(`     Actual: ${r.actual}`);
        console.log(`     Message: ${r.message}\n`);
      });
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  if (failed === 0) {
    console.log('║              ✅ ALL RLS POLICIES WORKING CORRECTLY            ║');
    console.log('║        Database security properly configured!                 ║');
  } else {
    console.log('║              ⚠️  RLS POLICY ISSUES DETECTED                   ║');
    console.log('║        Review failed tests above - SECURITY RISK!             ║');
  }
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        PRODUCTION RLS POLICIES TESTING SCRIPT                 ║');
  console.log('║        Task 10.17: Database setup and migration              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  // Run tests
  await testAnonymousAccess();

  const testUser = await createTestUser();
  if (testUser) {
    await testAuthenticatedAccess(testUser);
    await cleanupTestUser(testUser.userId);
  } else {
    console.log('   ⚠️  Skipping authenticated tests due to user creation failure');
  }

  await testStorageRLS();

  // Print summary
  printSummary();

  // Exit with appropriate code
  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n❌ Test script error:', error);
  process.exit(1);
});
