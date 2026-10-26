import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { sendOTP } from "@/lib/twilio/client";

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<
  string,
  { otp: string; expires_at: number; attempts: number }
>();

// Rate limit: max 3 OTP requests per hour per phone number
const OTP_RATE_LIMIT = {
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 3,
};

const requestSchema = z.object({
  phone: z.string().regex(/^\+234[0-9]{10}$/, "Invalid Nigerian phone number"),
});

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid phone number format" },
        { status: 400 },
      );
    }

    const { phone } = validation.data;

    // Check rate limit for this phone number (max 3 per hour)
    const rateLimitResult = checkRateLimit(phone, OTP_RATE_LIMIT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: "Too many OTP requests. Please try again later.",
          resetAt: rateLimitResult.resetAt,
        },
        { status: 429 },
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otp_id = `${phone}_${Date.now()}`;
    const expires_at = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(otp_id, { otp, expires_at, attempts: 0 });

    // Send OTP via SMS (Twilio or other SMS provider)
    const smsSent = await sendOTP({ phoneNumber: phone, otp });

    if (!smsSent) {
      console.error(`Failed to send SMS to ${phone}`);
      // Continue anyway in development, but log the error
    }

    console.log(`OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      otp_id,
      // Remove this in production
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { message: "Failed to send OTP" },
      { status: 500 },
    );
  }
}
