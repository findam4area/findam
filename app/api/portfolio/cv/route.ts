import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_CV_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * POST /api/portfolio/cv
 * Upload CV/Resume for job seekers
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_CV_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_CV_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and Word documents are allowed" },
        { status: 400 },
      );
    }

    // Generate unique filename for CV
    const fileExt = file.name.split(".").pop();
    const fileName = `cvs/${user.id}/cv-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("portfolio")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true, // Allow updating CV
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("portfolio").getPublicUrl(data.path);

    // Update user's CV URL
    const { error: updateError } = await supabase
      .from("users")
      .update({ cv_url: publicUrl, is_job_seeker: true })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Error uploading CV:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/portfolio/cv
 * Delete user's CV
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current CV URL
    const { data: userData } = await supabase
      .from("users")
      .select("cv_url")
      .eq("id", user.id)
      .single();

    if (userData?.cv_url) {
      // Extract path from URL and delete
      try {
        const url = new URL(userData.cv_url);
        const path = url.pathname.split(
          "/storage/v1/object/public/portfolio/",
        )[1];
        if (path) {
          await supabase.storage.from("portfolio").remove([path]);
        }
      } catch (e) {
        console.warn("Failed to delete CV from storage:", e);
      }
    }

    // Update user's CV URL to null
    const { error } = await supabase
      .from("users")
      .update({ cv_url: null })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting CV:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
