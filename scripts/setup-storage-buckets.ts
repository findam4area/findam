/**
 * Setup script for Supabase storage buckets
 * Implements Requirements: 13.3, 13.5, 13.6, 13.15, 15.1, 15.10
 * Task: 1.6 Create Supabase storage buckets with RLS policies
 * 
 * This script:
 * 1. Creates avatars and listings storage buckets
 * 2. Configures bucket settings (file size limits, allowed MIME types)
 * 3. Sets up RLS policies for secure access control
 * 4. Performs a test upload to verify configuration
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Bucket configuration matching design specs
 */
const BUCKET_CONFIG = {
  avatars: {
    id: 'avatars',
    name: 'avatars',
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  listings: {
    id: 'listings',
    name: 'listings',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
};

/**
 * Storage RLS policies matching design specs
 */
const STORAGE_POLICIES = {
  // Listings bucket policies
  listings_select: {
    bucket: 'listings',
    name: 'listings_select',
    definition: `bucket_id = 'listings'`,
    operation: 'SELECT'
  },
  listings_insert: {
    bucket: 'listings',
    name: 'listings_insert',
    definition: `bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text AND auth.role() = 'authenticated'`,
    operation: 'INSERT'
  },
  listings_delete: {
    bucket: 'listings',
    name: 'listings_delete',
    definition: `bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text AND auth.role() = 'authenticated'`,
    operation: 'DELETE'
  },
  // Avatars bucket policies
  avatars_select: {
    bucket: 'avatars',
    name: 'avatars_select',
    definition: `bucket_id = 'avatars'`,
    operation: 'SELECT'
  },
  avatars_insert: {
    bucket: 'avatars',
    name: 'avatars_insert',
    definition: `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text AND auth.role() = 'authenticated'`,
    operation: 'INSERT'
  },
  avatars_update: {
    bucket: 'avatars',
    name: 'avatars_update',
    definition: `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text AND auth.role() = 'authenticated'`,
    operation: 'UPDATE'
  },
  avatars_delete: {
    bucket: 'avatars',
    name: 'avatars_delete',
    definition: `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text AND auth.role() = 'authenticated'`,
    operation: 'DELETE'
  }
};

/**
 * Create or update a storage bucket
 */
async function createBucket(bucketId: string, config: typeof BUCKET_CONFIG.avatars) {
  console.log(`\n📦 Setting up bucket: ${bucketId}`);
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error(`   ❌ Error listing buckets:`, listError.message);
    return false;
  }
  
  const bucketExists = buckets?.some(b => b.id === bucketId);
  
  if (bucketExists) {
    console.log(`   ℹ️  Bucket already exists, updating configuration...`);
    const { error: updateError } = await supabase.storage.updateBucket(bucketId, {
      public: config.public,
      fileSizeLimit: config.fileSizeLimit,
      allowedMimeTypes: config.allowedMimeTypes
    });
    
    if (updateError) {
      console.error(`   ❌ Error updating bucket:`, updateError.message);
      return false;
    }
    console.log(`   ✅ Bucket updated successfully`);
  } else {
    console.log(`   ℹ️  Creating new bucket...`);
    const { error: createError } = await supabase.storage.createBucket(bucketId, {
      public: config.public,
      fileSizeLimit: config.fileSizeLimit,
      allowedMimeTypes: config.allowedMimeTypes
    });
    
    if (createError) {
      console.error(`   ❌ Error creating bucket:`, createError.message);
      return false;
    }
    console.log(`   ✅ Bucket created successfully`);
  }
  
  console.log(`   📋 Configuration:`);
  console.log(`      - Public: ${config.public}`);
  console.log(`      - Size limit: ${(config.fileSizeLimit / 1024 / 1024).toFixed(1)}MB`);
  console.log(`      - Allowed types: ${config.allowedMimeTypes.join(', ')}`);
  
  return true;
}

/**
 * Apply RLS policies via SQL
 * Note: We'll read and apply the SQL migration file
 */
async function applyRLSPolicies() {
  console.log(`\n🔒 Applying RLS policies...`);
  
  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20240115_create_storage_buckets.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`   ❌ Migration file not found: ${migrationPath}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split SQL statements and execute
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));
    
    console.log(`   ℹ️  Found ${statements.length} SQL statements to execute`);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // If exec_sql doesn't exist, we need to apply via Supabase dashboard or CLI
        console.log(`   ⚠️  Cannot apply policies programmatically`);
        console.log(`   ℹ️  Please apply the migration file manually using:`);
        console.log(`      supabase db push`);
        console.log(`      or via Supabase Dashboard SQL Editor`);
        return false;
      }
    }
    
    console.log(`   ✅ RLS policies applied successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error applying RLS policies:`, error);
    return false;
  }
}

/**
 * Test bucket configuration with a sample upload
 */
async function testBucketUpload(bucketId: string) {
  console.log(`\n🧪 Testing ${bucketId} bucket upload...`);
  
  try {
    // Create a minimal test image (1x1 transparent PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const testPath = `test-${Date.now()}.png`;
    
    // Upload test file
    const { error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(testPath, testImageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`   ❌ Upload failed:`, uploadError.message);
      return false;
    }
    
    console.log(`   ✅ Test upload successful`);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketId)
      .getPublicUrl(testPath);
    
    if (urlData?.publicUrl) {
      console.log(`   🔗 Public URL generated: ${urlData.publicUrl.substring(0, 60)}...`);
    }
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from(bucketId)
      .remove([testPath]);
    
    if (deleteError) {
      console.error(`   ⚠️  Failed to clean up test file:`, deleteError.message);
    } else {
      console.log(`   🧹 Test file cleaned up`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Test failed:`, error);
    return false;
  }
}

/**
 * Main setup function
 */
async function setupStorageBuckets() {
  console.log('🚀 Starting Supabase Storage Bucket Setup');
  console.log('==========================================');
  
  let success = true;
  
  // Create avatars bucket
  if (!await createBucket('avatars', BUCKET_CONFIG.avatars)) {
    success = false;
  }
  
  // Create listings bucket
  if (!await createBucket('listings', BUCKET_CONFIG.listings)) {
    success = false;
  }
  
  // Apply RLS policies
  console.log(`\n📝 Note: RLS policies should be applied via migration:`);
  console.log(`   Run: supabase db push`);
  console.log(`   Or apply via Supabase Dashboard SQL Editor`);
  console.log(`   File: supabase/migrations/20240115_create_storage_buckets.sql`);
  
  // Test bucket uploads
  if (!await testBucketUpload('avatars')) {
    success = false;
  }
  
  if (!await testBucketUpload('listings')) {
    success = false;
  }
  
  console.log('\n==========================================');
  if (success) {
    console.log('✅ Storage bucket setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - avatars bucket: ✅ (2MB limit, public read)');
    console.log('   - listings bucket: ✅ (5MB limit, public read)');
    console.log('   - Test uploads: ✅');
    console.log('\n⚠️  Remember to apply RLS policies using:');
    console.log('   supabase db push');
  } else {
    console.log('⚠️  Storage bucket setup completed with warnings');
    console.log('   Please review the errors above and fix them manually');
  }
  
  process.exit(success ? 0 : 1);
}

// Run the setup
setupStorageBuckets().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
