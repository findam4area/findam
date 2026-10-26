import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateUserTrustScore } from "@/lib/api/verification";
import { z } from "zod";

const videoSchema = z.object({
  video_url: z.string().url("Invalid video URL"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = videoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid video URL" },
        { status: 400 },
      );
    }

    const { video_url } = validation.data;

    // Check if user already has video verification
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("video_verified")
      .eq("id", user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { message: "Failed to fetch user data" },
        { status: 500 },
      );
    }

    if (userData.video_verified) {
      return NextResponse.json(
        { message: "Video already verified" },
        { status: 400 },
      );
    }

    // In production, this would:
    // 1. Perform liveness detection on video
    // 2. Verify video quality and duration
    // 3. Queue for admin review if needed

    // For development, auto-approve
    const { error: updateError } = await supabase
      .from("users")
      .update({
        video_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { message: "Failed to verify video" },
        { status: 500 },
      );
    }

    // Update trust score
    try {
      await updateUserTrustScore(user.id);
    } catch (error) {
      console.error("Error updating trust score:", error);
      // Don't fail the request if trust score update fails
    }

    return NextResponse.json({
      success: true,
      message: "Video verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Error verifying video:", error);
    return NextResponse.json(
      { message: "Failed to verify video" },
      { status: 500 },
    );
  }
}
