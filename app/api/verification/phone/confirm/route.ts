import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateUserTrustScore } from "@/lib/api/verification";
import { z } from "zod";

// Import OTP store from request route (in production, use shared storage)
const otpStore = new Map<
  string,
  { otp: string; expires_at: number; attempts: number }
>();

const confirmSchema = z.object({
  phone: z.string().regex(/^\+234[0-9]{10}$/, "Invalid Nigerian phone number"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  otp_id: z.string(),
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
    const validation = confirmSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 },
      );
    }

    const { phone, otp, otp_id } = validation.data;

    // Get stored OTP
    const storedOTP = otpStore.get(otp_id);

    if (!storedOTP) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    // Check expiration
    if (Date.now() > storedOTP.expires_at) {
      otpStore.delete(otp_id);
      return NextResponse.json({ message: "OTP expired" }, { status: 400 });
    }

    // Check attempts (max 3)
    if (storedOTP.attempts >= 3) {
      otpStore.delete(otp_id);
      return NextResponse.json(
        { message: "Too many failed attempts" },
        { status: 400 },
      );
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      return NextResponse.json(
        {
          message: "Invalid OTP",
          attempts_remaining: 3 - storedOTP.attempts,
        },
        { status: 400 },
      );
    }

    // OTP is valid, update user
    const { error: updateError } = await supabase
      .from("users")
      .update({
        phone,
        phone_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { message: "Failed to verify phone" },
        { status: 500 },
      );
    }

    // Delete OTP from store
    otpStore.delete(otp_id);

    // Update trust score
    try {
      await updateUserTrustScore(user.id);
    } catch (error) {
      console.error("Error updating trust score:", error);
      // Don't fail the request if trust score update fails
    }

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Error confirming OTP:", error);
    return NextResponse.json(
      { message: "Failed to verify OTP" },
      { status: 500 },
    );
  }
}
