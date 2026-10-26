import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const listingId = formData.get("listing_id") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only images and videos are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (50MB for videos, 5MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${isVideo ? "50MB" : "5MB"}`,
        },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("listing-media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("listing-media").getPublicUrl(fileName);

    // If listing_id is provided, create media record
    if (listingId) {
      // Get current media count for display order
      const { count } = await supabase
        .from("listing_media")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listingId);

      const { error: mediaError } = await supabase
        .from("listing_media")
        .insert({
          listing_id: listingId,
          media_url: publicUrl,
          media_type: isVideo ? "video" : "image",
          display_order: count || 0,
        });

      if (mediaError) throw mediaError;

      // Update listing thumbnail if this is the first media
      if (count === 0) {
        await supabase
          .from("listings")
          .update({ thumbnail_url: publicUrl })
          .eq("id", listingId);
      }
    }

    return NextResponse.json({
      url: publicUrl,
      media_type: isVideo ? "video" : "image",
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 },
    );
  }
}
