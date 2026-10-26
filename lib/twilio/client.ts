/**
 * Twilio SMS OTP Configuration
 *
 * Note: Twilio SDK is not installed by default to keep bundle size small.
 * Install with: npm install twilio
 *
 * This file provides a simple interface for sending OTP via SMS
 */

interface SendOTPParams {
  phoneNumber: string;
  otp: string;
}

/**
 * Send OTP via Twilio SMS
 * @param params - Phone number and OTP code
 * @returns Promise resolving to success status
 */
export async function sendOTP(params: SendOTPParams): Promise<boolean> {
  const { phoneNumber, otp } = params;

  try {
    // In production, use Twilio SDK
    // const twilio = require('twilio');
    // const client = twilio(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );
    //
    // await client.messages.create({
    //   body: `Your FindAm verification code is: ${otp}. Valid for 10 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });

    // For development, log to console
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);
      return true;
    }

    // TODO: Implement actual Twilio integration
    console.warn("Twilio SMS not configured. OTP:", otp);
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
}

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Rate limiting for OTP requests
 * Max 3 OTP requests per hour per phone number
 */
const otpRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkOTPRateLimit(phoneNumber: string): {
  allowed: boolean;
  remainingAttempts: number;
} {
  const now = Date.now();
  const limit = otpRateLimits.get(phoneNumber);

  // Reset if hour has passed
  if (!limit || now > limit.resetAt) {
    otpRateLimits.set(phoneNumber, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 hour
    });
    return { allowed: true, remainingAttempts: 2 };
  }

  // Check if limit exceeded
  if (limit.count >= 3) {
    return { allowed: false, remainingAttempts: 0 };
  }

  // Increment count
  limit.count++;
  return { allowed: true, remainingAttempts: 3 - limit.count };
}
