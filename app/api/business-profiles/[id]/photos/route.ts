/**
 * Business Profile Photos API Route
 * Task 5.6: Implement photo upload for business profiles
 * Requirements: 13.1, 13.2, 13.3, 13.6
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateProfileCompleteness } from "@/lib/utils/profile-completeness";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum number of photos per business profile
const MAX_PHOTOS = 50;

// Allowed MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/business-profiles/[id]/photos
 * Upload photos to a business profile
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload photos." },
        { status: 401 },
      );
    }

    // Verify the profile exists and belongs to the user
    const { data: existingProfile, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    if (existingProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only upload photos to your own business profile." },
        { status: 403 },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];
    const primaryPhotoIndex = formData.get("primary_photo_index");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No photos provided" },
        { status: 400 },
      );
    }

    // Check total photo count (existing + new)
    const existingPhotoCount = existingProfile.photo_urls?.length || 0;
    if (existingPhotoCount + files.length > MAX_PHOTOS) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_PHOTOS} photos allowed. You currently have ${existingPhotoCount} photos. You can upload ${MAX_PHOTOS - existingPhotoCount} more.`,
        },
        { status: 400 },
      );
    }

    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds maximum size of 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
          },
          { status: 400 },
        );
      }

      // Check file format
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" has invalid format. Allowed formats: JPEG, PNG, WebP`,
          },
          { status: 400 },
        );
      }
    }

    // Upload files to Supabase Storage
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}-${Date.now()}-${i}.${fileExt}`;
      const filePath = `business-profiles/${id}/${fileName}`;

      // Convert File to ArrayBuffer then to Buffer for Supabase
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("listing-media")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: `Failed to upload file "${file.name}"` },
          { status: 500 },
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("listing-media").getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    // Update business profile with new photo URLs
    const updatedPhotoUrls = [
      ...(existingProfile.photo_urls || []),
      ...uploadedUrls,
    ];

    // Determine primary photo URL
    let primaryPhotoUrl = existingProfile.primary_photo_url;

    if (primaryPhotoIndex !== null) {
      const index = parseInt(primaryPhotoIndex.toString(), 10);
      if (index >= 0 && index < uploadedUrls.length) {
        primaryPhotoUrl = uploadedUrls[index];
      }
    } else if (!primaryPhotoUrl && uploadedUrls.length > 0) {
      // If no primary photo exists, set the first uploaded photo as primary
      primaryPhotoUrl = uploadedUrls[0];
    }

    // Recalculate completeness percentage
    const { data: products } = await supabase
      .from("product_listings")
      .select("id")
      .eq("business_profile_id", id)
      .eq("is_active", true);

    const { data: services } = await supabase
      .from("service_listings")
      .select("id")
      .eq("business_profile_id", id)
      .eq("is_active", true);

    const profileForCompleteness = {
      ...existingProfile,
      photo_urls: updatedPhotoUrls,
      primary_photo_url: primaryPhotoUrl,
      products: products || [],
      services: services || [],
    } as any;

    const completenessPercentage = calculateProfileCompleteness(
      profileForCompleteness,
    );

    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from("business_profiles")
      .update({
        photo_urls: updatedPhotoUrls,
        primary_photo_url: primaryPhotoUrl,
        completeness_percentage: completenessPercentage,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update business profile with new photos" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      photo_urls: uploadedUrls,
      primary_photo_url: primaryPhotoUrl,
      total_photos: updatedPhotoUrls.length,
      completeness_percentage: completenessPercentage,
      message: `Successfully uploaded ${uploadedUrls.length} photo(s)`,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
