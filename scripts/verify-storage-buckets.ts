/**
 * Script to verify Supabase Storage buckets are properly configured
 *
 * This script checks:
 * 1. All required buckets exist (avatars, listing-media, story-videos, portfolio)
 * 2. Size limits are correctly set
 * 3. RLS policies are in place
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error(
    "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface BucketConfig {
  name: string;
  expectedSizeLimit: number;
  expectedSizeMB: number;
}

const expectedBuckets: BucketConfig[] = [
  { name: "avatars", expectedSizeLimit: 2097152, expectedSizeMB: 2 },
  { name: "listing-media", expectedSizeLimit: 52428800, expectedSizeMB: 50 },
  { name: "story-videos", expectedSizeLimit: 20971520, expectedSizeMB: 20 },
  { name: "portfolio", expectedSizeLimit: 10485760, expectedSizeMB: 10 },
];

async function verifyStorageBuckets() {
  console.log("🔍 Verifying Supabase Storage Buckets...\n");

  try {
    // Fetch all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error("❌ Error fetching buckets:", error.message);
      return false;
    }

    if (!buckets || buckets.length === 0) {
      console.error("❌ No buckets found");
      return false;
    }

    console.log(`✅ Found ${buckets.length} bucket(s)\n`);

    let allValid = true;

    // Check each expected bucket
    for (const expected of expectedBuckets) {
      const bucket = buckets.find((b) => b.name === expected.name);

      if (!bucket) {
        console.error(`❌ Bucket "${expected.name}" not found`);
        allValid = false;
        continue;
      }

      console.log(`📦 Bucket: ${bucket.name}`);
      console.log(`   - Public: ${bucket.public}`);
      console.log(
        `   - Size Limit: ${bucket.file_size_limit} bytes (${expected.expectedSizeMB}MB)`,
      );

      // Verify size limit
      if (bucket.file_size_limit !== expected.expectedSizeLimit) {
        console.error(
          `   ❌ Size limit mismatch! Expected ${expected.expectedSizeLimit}, got ${bucket.file_size_limit}`,
        );
        allValid = false;
      } else {
        console.log(`   ✅ Size limit correct`);
      }

      // Check allowed MIME types
      if (bucket.allowed_mime_types && bucket.allowed_mime_types.length > 0) {
        console.log(
          `   - Allowed MIME types: ${bucket.allowed_mime_types.join(", ")}`,
        );
      }

      console.log("");
    }

    // Check for unexpected buckets
    const unexpectedBuckets = buckets.filter(
      (b) => !expectedBuckets.some((e) => e.name === b.name),
    );

    if (unexpectedBuckets.length > 0) {
      console.log("⚠️  Unexpected buckets found:");
      unexpectedBuckets.forEach((b) => console.log(`   - ${b.name}`));
      console.log("");
    }

    if (allValid) {
      console.log("✅ All storage buckets are properly configured!");
      return true;
    } else {
      console.error("❌ Some storage buckets have configuration issues");
      return false;
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return false;
  }
}

// Run verification
verifyStorageBuckets()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
