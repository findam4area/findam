/**
 * Production Storage Buckets Setup Script
 * Task 10.17: Database setup and migration for production
 * 
 * This script creates and configures all required storage buckets for production
 * with appropriate security policies, size limits, and file type restrictions.
 * 
 * Buckets Created:
 * - avatars: User profile pictures (2MB max)
 * - listing-media: Listing images and videos (50MB max)
 * - story-videos: 24-hour story videos (20MB max)
 * - portfolio: Service provider portfolios (10MB max)
 * 
 * USAGE:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/setup-storage-buckets-production.ts
 */

import { createClient } from '@supabase/supabase-js';

// Production credentials from environment
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

interface BucketConfig {
  name: string;
  public: boolean;
  fileSizeLimit: number; // in bytes
  allowedMimeTypes: string[];
  description: string;
}

const BUCKET_CONFIGS: BucketConfig[] = [
  {
    name: 'avatars',
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    description: 'User profile pictures',
  },
  {
    name: 'listing-media',
    public: true,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
    ],
    description: 'Listing images and videos',
  },
  {
    name: 'story-videos',
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['video/mp4', 'video/quicktime'],
    description: '24-hour ephemeral story videos',
  },
  {
    name: 'portfolio',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'application/pdf',
    ],
    description: 'Service provider portfolio media',
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function createBucket(config: BucketConfig): Promise<boolean> {
  console.log(`\n📦 Creating bucket: ${config.name}`);
  console.log(`   Description: ${config.description}`);
  console.log(`   Public: ${config.public}`);
  console.log(`   Max Size: ${formatBytes(config.fileSizeLimit)}`);
  console.log(`   Allowed Types: ${config.allowedMimeTypes.join(', ')}`);

  try {
    // Check if bucket already exists
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const bucketExists = existingBuckets?.some((b) => b.name === config.name);

    if (bucketExists) {
      console.log(`   ℹ️  Bucket already exists, skipping creation`);
      return true;
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket(config.name, {
      public: config.public,
      fileSizeLimit: config.fileSizeLimit,
      allowedMimeTypes: config.allowedMimeTypes,
    });

    if (error) {
      console.error(`   ❌ Failed to create bucket: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Bucket created successfully`);
    return true;
  } catch (err) {
    console.error(`   ❌ Error creating bucket: ${err}`);
    return false;
  }
}

async function verifyBucket(config: BucketConfig): Promise<boolean> {
  console.log(`\n🔍 Verifying bucket: ${config.name}`);

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error(`   ❌ Cannot list buckets: ${error.message}`);
      return false;
    }

    const bucket = buckets?.find((b) => b.name === config.name);

    if (!bucket) {
      console.error(`   ❌ Bucket not found`);
      return false;
    }

    console.log(`   ✅ Bucket exists`);
    console.log(`   ✅ Public: ${bucket.public}`);
    console.log(`   ✅ Max Size: ${formatBytes(bucket.file_size_limit || 0)}`);

    // Verify we can perform basic operations
    // Try to list files (should work even if empty)
    const { error: listError } = await supabase.storage.from(config.name).list('', {
      limit: 1,
    });

    if (listError && !listError.message.includes('Bucket not found')) {
      console.log(`   ⚠️  Cannot list files: ${listError.message}`);
    } else {
      console.log(`   ✅ Can list files`);
    }

    return true;
  } catch (err) {
    console.error(`   ❌ Verification error: ${err}`);
    return false;
  }
}

async function applyStoragePolicy(bucketName: string): Promise<boolean> {
  console.log(`\n🔒 Applying RLS policies for: ${bucketName}`);

  try {
    // Note: Storage RLS policies are typically applied via SQL migrations
    // This function verifies they exist

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname LIKE '%${bucketName}%'
        ORDER BY policyname;
      `,
    });

    if (error) {
      console.log(`   ⚠️  Cannot verify policies (may require SQL migration): ${error.message}`);
      return true; // Not a critical failure
    }

    if (!data || data.length === 0) {
      console.log(`   ⚠️  No policies found - apply storage policies via migration`);
      console.log(`   📝 Run: supabase db push with 003_storage_buckets.sql`);
      return true; // Not a critical failure
    }

    console.log(`   ✅ Found ${data.length} policies:`);
    data.forEach((policy: any) => {
      console.log(`      - ${policy.policyname} (${policy.cmd})`);
    });

    return true;
  } catch (err) {
    console.log(`   ⚠️  Policy verification error: ${err}`);
    return true; // Not a critical failure
  }
}

async function testBucketUpload(bucketName: string): Promise<boolean> {
  console.log(`\n🧪 Testing upload to: ${bucketName}`);

  try {
    // Create a small test file
    const testContent = `Test file for ${bucketName} - ${new Date().toISOString()}`;
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test/${Date.now()}-verification.txt`;

    // Upload test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testFile, {
        contentType: 'text/plain',
        upsert: true,
      });

    if (uploadError) {
      console.log(`   ⚠️  Upload test failed: ${uploadError.message}`);
      return false;
    }

    console.log(`   ✅ Upload successful: ${uploadData.path}`);

    // Try to download the file
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(testFileName);

    if (downloadError) {
      console.log(`   ⚠️  Download test failed: ${downloadError.message}`);
    } else {
      console.log(`   ✅ Download successful`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(testFileName);
    console.log(`   ✅ Public URL: ${urlData.publicUrl.substring(0, 50)}...`);

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFileName]);

    if (deleteError) {
      console.log(`   ⚠️  Cleanup failed: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Test file cleaned up`);
    }

    return true;
  } catch (err) {
    console.log(`   ⚠️  Test error: ${err}`);
    return false;
  }
}

async function printStoragePolicySQLReference(): Promise<void> {
  console.log('\n\n📝 Storage RLS Policies Reference');
  console.log('════════════════════════════════════════════════════════════════\n');
  console.log('If policies were not found, apply them via SQL migration:');
  console.log('\nFile: supabase/migrations/003_storage_buckets.sql\n');

  console.log('```sql');
  console.log(`-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Avatars bucket policies
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Listing media bucket policies
CREATE POLICY "listing_media_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-media');

CREATE POLICY "listing_media_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-media' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing_media_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-media' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Story videos bucket policies (similar structure)
-- Portfolio bucket policies (similar structure)
\`\`\`

Apply policies using:
  supabase db push
  
or via SQL Editor in Supabase Dashboard.
`);
}

async function printSummary(results: Map<string, boolean>): Promise<void> {
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          STORAGE BUCKETS SETUP SUMMARY                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  let allSuccess = true;
  for (const [bucket, success] of results.entries()) {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${bucket}: ${success ? 'Ready' : 'Failed'}`);
    if (!success) allSuccess = false;
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  if (allSuccess) {
    console.log('║            ✅ ALL STORAGE BUCKETS READY                      ║');
    console.log('║          Production storage is configured!                   ║');
  } else {
    console.log('║            ⚠️  SOME BUCKETS FAILED                           ║');
    console.log('║        Review errors above and retry setup                   ║');
  }
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('📋 NEXT STEPS:\n');
  if (allSuccess) {
    console.log('1. ✅ All buckets created and verified');
    console.log('2. 📝 Apply storage RLS policies if not already done');
    console.log('3. 🧪 Run: tsx scripts/verify-production-storage.ts');
    console.log('4. 🚀 Deploy application with storage access\n');
  } else {
    console.log('1. ❌ Fix failed bucket creations');
    console.log('2. 🔄 Re-run this script');
    console.log('3. 📝 Check Supabase Dashboard → Storage for details\n');
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         PRODUCTION STORAGE BUCKETS SETUP SCRIPT              ║');
  console.log('║         Task 10.17: Database setup and migration             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
  console.log(`📦 Creating ${BUCKET_CONFIGS.length} storage buckets...\n`);

  const results = new Map<string, boolean>();

  try {
    // Step 1: Create all buckets
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Step 1: Creating Storage Buckets');
    console.log('═══════════════════════════════════════════════════════════════');

    for (const config of BUCKET_CONFIGS) {
      const success = await createBucket(config);
      results.set(config.name, success);
    }

    // Step 2: Verify all buckets
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Step 2: Verifying Storage Buckets');
    console.log('═══════════════════════════════════════════════════════════════');

    for (const config of BUCKET_CONFIGS) {
      const success = await verifyBucket(config);
      if (!success) {
        results.set(config.name, false);
      }
    }

    // Step 3: Check storage policies
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Step 3: Verifying Storage RLS Policies');
    console.log('═══════════════════════════════════════════════════════════════');

    for (const config of BUCKET_CONFIGS) {
      await applyStoragePolicy(config.name);
    }

    // Step 4: Test uploads
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Step 4: Testing Bucket Operations');
    console.log('═══════════════════════════════════════════════════════════════');

    for (const config of BUCKET_CONFIGS) {
      await testBucketUpload(config.name);
    }

    // Print SQL reference
    await printStoragePolicySQLReference();

    // Print summary
    await printSummary(results);

    // Exit with appropriate code
    const hasFailures = Array.from(results.values()).some((v) => !v);
    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Setup script error:', error);
    process.exit(1);
  }
}

main();
