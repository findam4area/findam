import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateUserTrustScore } from "@/lib/api/verification";
import { z } from "zod";

const ninSchema = z.object({
  nin: z.string().length(11, "NIN must be 11 digits"),
  selfie_url: z.string().url("Invalid selfie URL"),
  video_url: z.string().url("Invalid video URL"),
});

// In-memory verification requests storage (in production, use database)
const verificationRequests = new Map<
  string,
  {
    user_id: string;
    nin: string;
    selfie_url: string;
    video_url: string;
    status: "pending" | "approved" | "rejected";
    created_at: number;
  }
>();

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
    const validation = ninSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid verification data",
          errors: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const { nin, selfie_url, video_url } = validation.data;

    // Check if user already has NIN verification
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("nin_verified")
      .eq("id", user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { message: "Failed to fetch user data" },
        { status: 500 },
      );
    }

    if (userData.nin_verified) {
      return NextResponse.json(
        { message: "NIN already verified" },
        { status: 400 },
      );
    }

    // Create verification request
    const verification_id = `nin_${user.id}_${Date.now()}`;
    verificationRequests.set(verification_id, {
      user_id: user.id,
      nin,
      selfie_url,
      video_url,
      status: "pending",
      created_at: Date.now(),
    });

    // In production, this would:
    // 1. Verify NIN with Nigerian identity service
    // 2. Perform liveness check on video
    // 3. Match selfie with NIN photo
    // 4. Queue for admin review if needed

    // For development, auto-approve after a delay
    if (process.env.NODE_ENV === "development") {
      setTimeout(async () => {
        const request = verificationRequests.get(verification_id);
        if (request && request.status === "pending") {
          request.status = "approved";

          // Update user
          const { error: updateError } = await supabase
            .from("users")
            .update({
              nin_verified: true,
              video_verified: true, // NIN verification includes video
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (!updateError) {
            // Update trust score
            try {
              await updateUserTrustScore(user.id);
            } catch (error) {
              console.error("Error updating trust score:", error);
            }
          }
        }
      }, 2000);
    }

    return NextResponse.json({
      success: true,
      message:
        "NIN verification submitted successfully. It will be reviewed shortly.",
      verification_id,
    });
  } catch (error) {
    console.error("Error submitting NIN verification:", error);
    return NextResponse.json(
      { message: "Failed to submit NIN verification" },
      { status: 500 },
    );
  }
}

// Get verification status
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const verification_id = searchParams.get("verification_id");

    if (!verification_id) {
      return NextResponse.json(
        { message: "Verification ID required" },
        { status: 400 },
      );
    }

    const verification = verificationRequests.get(verification_id);

    if (!verification || verification.user_id !== user.id) {
      return NextResponse.json(
        { message: "Verification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      status: verification.status,
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json(
      { message: "Failed to fetch verification status" },
      { status: 500 },
    );
  }
}
