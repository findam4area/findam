import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

/**
 * POST /api/admin/business-profiles/[id]/verify
 * 
 * Verify a business profile (admin only)
 * 
 * Task 11.1: Create POST /api/admin/business-profiles/[id]/verify endpoint
 * Requirements: 14.1, 14.4, 14.5
 * 
 * @body VerifyBusinessProfileRequest (optional)
 * {
 *   verification_notes?: string - Optional notes about the verification
 * }
 * 
 * @returns Updated business profile with verification status
 * 
 * Features:
 * - Requires admin authentication
 * - Sets is_verified = true
 * - Sets verified_at = NOW()
 * - Stores verification_notes in verification_documents JSONB
 * - Returns the updated business profile
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // Check admin authentication
    const authCheck = await checkAdminAuth(supabase);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 },
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid business profile ID format" },
        { status: 400 },
      );
    }

    // Parse request body (verification_notes is optional)
    const body = await request.json().catch(() => ({}));
    const { verification_notes } = body;

    // Check if business profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    // Check if already verified
    if (existingProfile.is_verified) {
      return NextResponse.json(
        { error: "Business profile is already verified" },
        { status: 400 },
      );
    }

    // Prepare verification documents JSONB
    const verification_documents = {
      verified_by: authCheck.user?.email || authCheck.user?.id,
      verified_at: new Date().toISOString(),
      notes: verification_notes || null,
    };

    // Update business profile with verification
    const { data: verifiedProfile, error: updateError } = await supabase
      .from("business_profiles")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_documents,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error verifying business profile:", updateError);
      return NextResponse.json(
        { error: "Failed to verify business profile" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        business_profile: verifiedProfile,
        message: "Business profile verified successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in verify business profile endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
