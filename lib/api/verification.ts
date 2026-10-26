// Verification API utilities for phone, NIN, and video verification

import { createClient } from "@/lib/supabase/client";

export interface OTPVerificationRequest {
  phone: string;
}

export interface OTPVerificationResponse {
  success: boolean;
  message: string;
  otp_id?: string;
}

export interface OTPConfirmRequest {
  phone: string;
  otp: string;
  otp_id: string;
}

export interface OTPConfirmResponse {
  success: boolean;
  message: string;
  verified: boolean;
}

export interface NINVerificationRequest {
  nin: string;
  selfie_url: string;
  video_url: string;
}

export interface NINVerificationResponse {
  success: boolean;
  message: string;
  verification_id?: string;
}

export interface VideoVerificationRequest {
  video_url: string;
}

export interface VideoVerificationResponse {
  success: boolean;
  message: string;
  verified: boolean;
}

/**
 * Request OTP for phone verification
 */
export async function requestPhoneOTP(
  phone: string,
): Promise<OTPVerificationResponse> {
  try {
    const response = await fetch("/api/verification/phone/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send OTP");
    }

    return response.json();
  } catch (error) {
    console.error("Error requesting OTP:", error);
    throw error;
  }
}

/**
 * Confirm OTP for phone verification
 */
export async function confirmPhoneOTP(
  phone: string,
  otp: string,
  otp_id: string,
): Promise<OTPConfirmResponse> {
  try {
    const response = await fetch("/api/verification/phone/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp, otp_id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to verify OTP");
    }

    return response.json();
  } catch (error) {
    console.error("Error confirming OTP:", error);
    throw error;
  }
}

/**
 * Submit NIN verification with selfie and video
 */
export async function submitNINVerification(
  nin: string,
  selfie_url: string,
  video_url: string,
): Promise<NINVerificationResponse> {
  try {
    const response = await fetch("/api/verification/nin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nin, selfie_url, video_url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit NIN verification");
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting NIN verification:", error);
    throw error;
  }
}

/**
 * Submit video verification
 */
export async function submitVideoVerification(
  video_url: string,
): Promise<VideoVerificationResponse> {
  try {
    const response = await fetch("/api/verification/video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ video_url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit video verification");
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting video verification:", error);
    throw error;
  }
}

/**
 * Calculate Trust Score based on verification status
 */
export function calculateTrustScore(
  phone_verified: boolean,
  nin_verified: boolean,
  video_verified: boolean,
  review_count: number = 0,
  average_rating: number = 0,
  is_premium: boolean = false,
): number {
  let score = 0;

  // Phone verification: +20 points
  if (phone_verified) score += 20;

  // NIN verification: +40 points
  if (nin_verified) score += 40;

  // Video verification: +40 points (increased from 20 to reach 100 with all verifications)
  if (video_verified) score += 40;

  // Reviews: up to 20 points (based on count and rating)
  if (review_count > 0 && average_rating > 0) {
    const reviewScore = Math.min(
      20,
      (review_count / 10) * 10 + (average_rating / 5) * 10,
    );
    score += Math.round(reviewScore);
  }

  return Math.min(100, score);
}

/**
 * Update user's Trust Score after verification
 */
export async function updateUserTrustScore(userId: string): Promise<number> {
  const supabase = createClient();

  // Get user's verification status
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("phone_verified, nin_verified, video_verified")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    throw new Error("Failed to fetch user data");
  }

  // Get user's reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_user_id", userId);

  if (reviewsError) {
    throw new Error("Failed to fetch reviews");
  }

  const review_count = reviews?.length || 0;
  const average_rating =
    review_count > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / review_count
      : 0;

  // Calculate new trust score
  const trust_score = calculateTrustScore(
    user.phone_verified ?? false,
    user.nin_verified ?? false,
    user.video_verified ?? false,
    review_count,
    average_rating,
  );

  // Update user's trust score
  const { error: updateError } = await supabase
    .from("users")
    .update({ trust_score })
    .eq("id", userId);

  if (updateError) {
    throw new Error("Failed to update trust score");
  }

  return trust_score;
}
