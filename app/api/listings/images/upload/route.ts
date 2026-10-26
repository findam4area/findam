import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/supabase/helpers";

/**
 * POST /api/listings/images/upload
 * Upload optimized listing images to Supabase Storage
 * Requirements: 26.4, 26.6, 26.7, 26.8, 26.10
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const sizes = formData.getAll("sizes") as string[];
    const originalFileName = formData.get("originalFileName") as string;

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate file count and sizes match
    if (files.length !== sizes.length) {
      return NextResponse.json(
        { error: "Files and sizes count mismatch" },
        { status: 400 }
      );
    }

    // Upload each optimized size
    const uploadedUrls: Record<string, string> = {};
    const timestamp = Date.now();
    const baseFileName = originalFileName.replace(/\.[^.]+$/, "");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const size = sizes[i];

      // Generate unique file path
      const fileName = `${user.id}/${timestamp}-${baseFileName}-${size}.webp`;

      // Validate file size (max 5MB per requirement 26.11)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        return NextResponse.json(
          {
            error: `File size for ${size} (${fileSizeMB.toFixed(2)}MB) exceeds 5MB limit`,
          },
          { status: 400 }
        );
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.LISTING_MEDIA)
        .upload(fileName, file, {
          cacheControl: "31536000", // 1 year
          upsert: false,
          contentType: "image/webp",
        });

      if (uploadError) {
        console.error(`Error uploading ${size}:`, uploadError);
        
        // Clean up already uploaded files
        const uploadedPaths = Object.values(uploadedUrls);
        if (uploadedPaths.length > 0) {
          await supabase.storage
            .from(STORAGE_BUCKETS.LISTING_MEDIA)
            .remove(uploadedPaths);
        }

        return NextResponse.json(
          { error: `Failed to upload ${size} size: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from(STORAGE_BUCKETS.LISTING_MEDIA)
        .getPublicUrl(fileName);

      uploadedUrls[size] = publicUrl;
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload images",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/images/upload
 * Delete listing images from Supabase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "No URLs provided" },
        { status: 400 }
      );
    }

    // Extract file paths from URLs
    const filePaths = urls.map((url: string) => {
      // URL format: https://.../storage/v1/object/public/listing-media/{userId}/{filename}
      const parts = url.split("/");
      const bucketIndex = parts.indexOf(STORAGE_BUCKETS.LISTING_MEDIA);
      if (bucketIndex === -1) return null;
      return parts.slice(bucketIndex + 1).join("/");
    }).filter(Boolean) as string[];

    if (filePaths.length === 0) {
      return NextResponse.json(
        { error: "Invalid URLs provided" },
        { status: 400 }
      );
    }

    // Delete files from storage
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKETS.LISTING_MEDIA)
      .remove(filePaths);

    if (deleteError) {
      console.error("Error deleting images:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete images: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: filePaths.length,
    });
  } catch (error) {
    console.error("Error deleting images:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete images",
      },
      { status: 500 }
    );
  }
}
