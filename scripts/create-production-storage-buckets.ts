/**
 * Production Storage Buckets Creation Script
 * Task 10.17: Database setup and migration for production
 * 
 * This script creates and configures all required storage buckets for production:
 * - avatars (2MB limit)
 * - listing-media (50MB limit)
 * - story-videos (20MB limit)
 * - portfolio (10MB limit)
 * 
 * USAGE:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/create-production-storage-buckets.ts
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

interface BucketConfig {
  name: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}

const BUCKET_CONFIGS: BucketConfig[] = [
  {
    name: 'avatars',
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  {
    name: 'listing-media',
    public: true,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
  {
    name: 'story-videos',
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['video/mp4'],
  },
  {
    name: 'portfolio',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function createBucket(config: BucketConfig): Promise<boolean> {
  console.log(`\n📦 Creating bucket: ${config.name}`);
  console.log(`   Public: ${config.public}`);
  console.log(`   Size Limit: ${formatBytes(config.fileSizeLimit)}`);
  console.log(`   Allowed Types: ${config.allowedMimeTypes.join(', ')}`);

  try {
    const { data, error } = await supabase.storage.createBucket(config.name, {
      public: config.public,
      fileSizeLimit: config.fileSizeLimit,
      allowedMimeTypes: config.allowedMimeTypes,
    });

    if (error) {
      // Check if bucket already exists
      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  Bucket already exists, skipping creation`);
        
        // Update bucket configuration
        const { error: updateError } = await supabase.storage.updateBucket(config.name, {
          public: config.public,
          fileSizeLimit: config.fileSizeLimit,
          allowedMimeTypes: config.allowedMimeTypes,
        });

        if (updateError) {
          console.log(`   ⚠️  Could not update bucket configuration: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated bucket configuration`);
        }
        
        return true;
      }

      console.log(`   ❌ Failed to create bucket: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Bucket created successfully`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error creating bucket: ${err}`);
    return false;
  }
}

async function applyStorageRLSPolicies(): Promise<void> {
  console.log('\n🔒 Applying Storage RLS Policies...');
  console.log('   ℹ️  Storage policies must be applied via SQL migration');
  console.log('   ℹ️  Run: supabase db push');
  console.log('   ℹ️  Or apply supabase/migrations/003_storage_buckets.sql manually');
}

async function verifyBuckets(): Promise<void> {
  console.log('\n✅ Verifying Bucket Configuration...');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.log(`   ❌ Cannot list buckets: ${error.message}`);
    return;
  }

  for (const config of BUCKET_CONFIGS) {
    const bucket = buckets.find((b) => b.name === config.name);
    if (bucket) {
      console.log(`\n   📦 ${config.name}:`);
      console.log(`      ✅ Exists`);
      console.log(`      Public: ${bucket.public}`);
      console.log(`      ID: ${bucket.id}`);
      console.log(`      Created: ${bucket.created_at}`);
    } else {
      console.log(`\n   📦 ${config.name}:`);
      console.log(`      ❌ Not found`);
    }
  }
}

async function testBucketUpload(): Promise<void> {
  console.log('\n🧪 Testing Bucket Upload...');

  // Create a small test file
  const testContent = 'Test file for production storage verification';
  const testBlob = new Blob([testContent], { type: 'text/plain' });
  const fileName = `test-${Date.now()}.txt`;

  // Test avatars bucket
  console.log(`   Testing upload to 'avatars' bucket...`);
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`test/${fileName}`, testBlob, {
      contentType: 'text/plain',
      upsert: true,
    });

  if (error) {
    console.log(`   ❌ Upload failed: ${error.message}`);
  } else {
    console.log(`   ✅ Upload successful`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`test/${fileName}`);

    console.log(`   📎 Public URL: ${urlData.publicUrl}`);

    // Clean up test file
    await supabase.storage.from('avatars').remove([`test/${fileName}`]);
    console.log(`   🗑️  Test file cleaned up`);
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        PRODUCTION STORAGE BUCKETS CREATION SCRIPT            ║');
  console.log('║        Task 10.17: Database setup and migration              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  console.log('📋 Buckets to create:');
  BUCKET_CONFIGS.forEach((config) => {
    console.log(`   • ${config.name} (${formatBytes(config.fileSizeLimit)})`);
  });

  let successCount = 0;
  let failCount = 0;

  // Create each bucket
  for (const config of BUCKET_CONFIGS) {
    const success = await createBucket(config);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Apply RLS policies reminder
  await applyStorageRLSPolicies();

  // Verify all buckets
  await verifyBuckets();

  // Test upload
  await testBucketUpload();

  // Summary
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    CREATION SUMMARY                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${BUCKET_CONFIGS.length}\n`);

  if (failCount === 0) {
    console.log('✅ All storage buckets created successfully!\n');
    console.log('⚠️  Next Steps:');
    console.log('   1. Apply storage RLS policies via SQL migration');
    console.log('   2. Test uploads from the application');
    console.log('   3. Verify bucket permissions work correctly\n');
  } else {
    console.log('⚠️  Some buckets failed to create. Review errors above.\n');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n❌ Script error:', error);
  process.exit(1);
});
