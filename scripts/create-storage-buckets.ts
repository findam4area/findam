/**
 * Script to create storage buckets in Supabase
 *
 * This script creates the required storage buckets using the Supabase Storage API
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  console.error("Checked for:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.error("  - SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.error("  - NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.error(
    "\nPlease ensure .env.local file exists with required variables",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface BucketConfig {
  id: string;
  name: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}

const bucketsToCreate: BucketConfig[] = [
  {
    id: "avatars",
    name: "avatars",
    public: true,
    fileSizeLimit: 2097152, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    id: "listings",
    name: "listings",
    public: true,
    fileSizeLimit: 5242880, // 5MB - Marketplace Enhancement
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    id: "listing-media",
    name: "listing-media",
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
  },
  {
    id: "story-videos",
    name: "story-videos",
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ["video/mp4"],
  },
  {
    id: "portfolio",
    name: "portfolio",
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
  },
];

async function createStorageBuckets() {
  console.log("Creating storage buckets...\n");

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const bucket of bucketsToCreate) {
    try {
      console.log(`Creating bucket: ${bucket.name}`);

      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });

      if (error) {
        if (error.message.includes("already exists")) {
          console.log(`  Bucket already exists, skipping...`);
          skipCount++;
        } else {
          console.error(`  Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`  Created successfully`);
        successCount++;
      }
    } catch (err) {
      console.error(`  Unexpected error: ${err}`);
      errorCount++;
    }
    console.log("");
  }

  console.log("Summary:");
  console.log(`  - Created: ${successCount}`);
  console.log(`  - Skipped (already exist): ${skipCount}`);
  console.log(`  - Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log("\nSome buckets failed to create.");
    console.log("  This might be because you need the service role key.");
    console.log(
      "  Please check your SUPABASE_SERVICE_ROLE_KEY environment variable.",
    );
    return false;
  }

  if (successCount > 0 || skipCount === bucketsToCreate.length) {
    console.log("\nAll buckets are ready!");
    return true;
  }

  return false;
}

// Run bucket creation
createStorageBuckets()
  .then((success) => {
    console.log("\nNext steps:");
    console.log("  1. Verify buckets: npm run verify:storage");
    console.log(
      "  2. Apply RLS policies via Supabase Dashboard or SQL Editor",
    );
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
