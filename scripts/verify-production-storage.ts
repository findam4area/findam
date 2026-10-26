/**
 * Production Storage Verification Script
 * Task 10.17: Database setup and migration for production
 * 
 * This script verifies that all storage buckets are properly configured in production.
 * 
 * USAGE:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/verify-production-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface BucketRequirement {
  name: string;
  expectedSize: number;
  expectedTypes: string[];
}

const REQUIRED_BUCKETS: BucketRequirement[] = [
  {
    name: 'avatars',
    expectedSize: 2 * 1024 * 1024, // 2MB
    expectedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  {
    name: 'listing-media',
    expectedSize: 50 * 1024 * 1024, // 50MB
    expectedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
  {
    name: 'story-videos',
    expectedSize: 20 * 1024 * 1024, // 20MB
    expectedTypes: ['video/mp4'],
  },
  {
    name: 'portfolio',
    expectedSize: 10 * 1024 * 1024, // 10MB
    expectedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
];

interface VerificationResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: VerificationResult[] = [];

function addResult(check: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
  results.push({ check, status, message });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} ${check}: ${message}`);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function verifyBucketsExist(): Promise<void> {
  console.log('\n🪣 Verifying Storage Buckets Exist...');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      addResult('List Buckets', 'FAIL', `Cannot list buckets: ${error.message}`);
      return;
    }

    addResult('List Buckets', 'PASS', `Found ${buckets.length} bucket(s)`);

    for (const required of REQUIRED_BUCKETS) {
      const bucket = buckets.find((b) => b.name === required.name);
      if (bucket) {
        console.log(`\n   📦 ${required.name}:`);
        console.log(`      ✅ Exists`);
        console.log(`      Public: ${bucket.public}`);
        console.log(`      ID: ${bucket.id}`);
        console.log(`      Created: ${bucket.created_at}`);

        addResult(`Bucket: ${required.name}`, 'PASS', 'Bucket exists');

        // Verify bucket is public
        if (!bucket.public) {
          addResult(
            `Bucket Public: ${required.name}`,
            'WARN',
            'Bucket is not public - public access may not work'
          );
        } else {
          addResult(`Bucket Public: ${required.name}`, 'PASS', 'Bucket is public');
        }
      } else {
        addResult(`Bucket: ${required.name}`, 'FAIL', 'Bucket does not exist');
      }
    }

    // Check for extra buckets
    const extraBuckets = buckets.filter(
      (b) => !REQUIRED_BUCKETS.some((r) => r.name === b.name)
    );
    if (extraBuckets.length > 0) {
      console.log('\n   ℹ️  Additional buckets found:');
      extraBuckets.forEach((b) => console.log(`      • ${b.name}`));
    }
  } catch (err) {
    addResult('Storage Verification', 'FAIL', `Error: ${err}`);
  }
}

async function testUploadDownload(): Promise<void> {
  console.log('\n🧪 Testing Upload/Download Functionality...');

  for (const bucket of REQUIRED_BUCKETS) {
    console.log(`\n   Testing ${bucket.name}...`);

    // Create test file
    const testContent = `Test file for ${bucket.name} - ${Date.now()}`;
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test/verify-${Date.now()}.txt`;

    try {
      // Test upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket.name)
        .upload(testFileName, testBlob, {
          contentType: 'text/plain',
          upsert: true,
        });

      if (uploadError) {
        addResult(`Upload: ${bucket.name}`, 'FAIL', `Upload failed: ${uploadError.message}`);
        continue;
      }

      addResult(`Upload: ${bucket.name}`, 'PASS', 'Upload successful');

      // Test download
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(bucket.name)
        .download(testFileName);

      if (downloadError) {
        addResult(
          `Download: ${bucket.name}`,
          'FAIL',
          `Download failed: ${downloadError.message}`
        );
      } else {
        addResult(`Download: ${bucket.name}`, 'PASS', 'Download successful');
      }

      // Test public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket.name)
        .getPublicUrl(testFileName);

      if (publicUrlData.publicUrl) {
        addResult(`Public URL: ${bucket.name}`, 'PASS', 'Public URL generated');
        console.log(`      📎 ${publicUrlData.publicUrl}`);
      }

      // Clean up
      const { error: deleteError } = await supabase.storage
        .from(bucket.name)
        .remove([testFileName]);

      if (deleteError) {
        console.log(`      ⚠️  Could not delete test file: ${deleteError.message}`);
      } else {
        console.log(`      🗑️  Test file cleaned up`);
      }
    } catch (err) {
      addResult(`Test: ${bucket.name}`, 'FAIL', `Test error: ${err}`);
    }
  }
}

async function testStorageRLS(): Promise<void> {
  console.log('\n🔒 Testing Storage RLS Policies...');

  // Create anonymous client
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    addResult('Storage RLS Test', 'WARN', 'NEXT_PUBLIC_SUPABASE_ANON_KEY not set, skipping RLS test');
    return;
  }

  const anonClient = createClient(SUPABASE_URL, anonKey);

  // Test 1: Anonymous can get public URL
  const { data: publicUrl } = anonClient.storage.from('avatars').getPublicUrl('test/dummy.jpg');
  if (publicUrl.publicUrl) {
    addResult('RLS: Anonymous Public URL', 'PASS', 'Can generate public URL');
  }

  // Test 2: Anonymous cannot upload
  const testBlob = new Blob(['test'], { type: 'text/plain' });
  const { error: uploadError } = await anonClient.storage
    .from('avatars')
    .upload('test/anon-test.txt', testBlob);

  if (uploadError) {
    addResult('RLS: Anonymous Upload (Should Fail)', 'PASS', 'Upload correctly blocked');
  } else {
    addResult(
      'RLS: Anonymous Upload (Should Fail)',
      'FAIL',
      'Upload allowed - security issue!'
    );
    // Clean up
    await supabase.storage.from('avatars').remove(['test/anon-test.txt']);
  }

  // Test 3: Anonymous cannot delete
  const { error: deleteError } = await anonClient.storage
    .from('avatars')
    .remove(['test/any-file.txt']);

  if (deleteError) {
    addResult('RLS: Anonymous Delete (Should Fail)', 'PASS', 'Delete correctly blocked');
  } else {
    addResult(
      'RLS: Anonymous Delete (Should Fail)',
      'FAIL',
      'Delete allowed - security issue!'
    );
  }
}

async function checkStorageUsage(): Promise<void> {
  console.log('\n💾 Checking Storage Usage...');

  for (const bucket of REQUIRED_BUCKETS) {
    try {
      const { data: files, error } = await supabase.storage.from(bucket.name).list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) {
        console.log(`   ⚠️  Cannot list files in ${bucket.name}: ${error.message}`);
        continue;
      }

      const fileCount = files?.length || 0;
      const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;

      console.log(`   📦 ${bucket.name}:`);
      console.log(`      Files: ${fileCount}`);
      console.log(`      Total Size: ${formatBytes(totalSize)}`);

      if (fileCount === 0) {
        console.log(`      ℹ️  No files in bucket (expected for new deployment)`);
      }
    } catch (err) {
      console.log(`   ⚠️  Error checking ${bucket.name}: ${err}`);
    }
  }
}

function printSummary(): void {
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           STORAGE VERIFICATION SUMMARY                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warnings = results.filter((r) => r.status === 'WARN').length;

  console.log(`✅ PASSED:   ${passed}`);
  console.log(`❌ FAILED:   ${failed}`);
  console.log(`⚠️  WARNINGS: ${warnings}`);
  console.log(`📊 TOTAL:    ${results.length}\n`);

  if (failed > 0) {
    console.log('❌ FAILED CHECKS:\n');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`   • ${r.check}: ${r.message}`);
      });
    console.log('');
  }

  if (warnings > 0) {
    console.log('⚠️  WARNINGS:\n');
    results
      .filter((r) => r.status === 'WARN')
      .forEach((r) => {
        console.log(`   • ${r.check}: ${r.message}`);
      });
    console.log('');
  }

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  if (failed === 0) {
    console.log('║         ✅ STORAGE PROPERLY CONFIGURED                        ║');
    console.log('║    All storage buckets ready for production use!             ║');
  } else {
    console.log('║         ⚠️  STORAGE CONFIGURATION ISSUES                      ║');
    console.log('║    Review failed checks above before deploying               ║');
  }
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        PRODUCTION STORAGE VERIFICATION SCRIPT                 ║');
  console.log('║        Task 10.17: Database setup and migration              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  // Run verification checks
  await verifyBucketsExist();
  await testUploadDownload();
  await testStorageRLS();
  await checkStorageUsage();

  // Print summary
  printSummary();

  // Exit with appropriate code
  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n❌ Verification script error:', error);
  process.exit(1);
});
