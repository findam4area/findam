import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { VerificationService } from "@/lib/services/verification";

/**
 * Revoke badge from a user
 * Requirements: 15.7
 * Tasks: 28.4
 *
 * POST /api/verification/badge/revoke
 * Body: { userId: string, reason: string }
 *
 * Revokes badge if:
 * - Rating drops below threshold
 * - Policy violations occur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const authError = await requireAdmin(supabase);
    if (authError) return authError;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { userId, reason } = body;

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "userId and reason are required" },
        { status: 400 },
      );
    }

    // Revoke badge
    const result = await VerificationService.revokeBadge(
      userId,
      reason,
      user?.id ?? "",
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to revoke badge" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Badge revoked successfully",
      badge: result,
    });
  } catch (error) {
    console.error("Badge revocation error:", error);
    return NextResponse.json(
      { error: "Failed to revoke badge" },
      { status: 500 },
    );
  }
}
