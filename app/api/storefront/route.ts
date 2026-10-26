import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storefrontService } from "@/lib/services/storefront";

/**
 * GET /api/storefront - Get current user's storefront
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storefront = await storefrontService.getOrCreateStorefront(user.id);

    return NextResponse.json({ storefront });
  } catch (error) {
    console.error("Failed to get storefront:", error);
    return NextResponse.json(
      { error: "Failed to get storefront" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/storefront - Update storefront
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const updatedStorefront = await storefrontService.updateStorefront(
      user.id,
      body,
    );

    return NextResponse.json({ storefront: updatedStorefront });
  } catch (error) {
    console.error("Failed to update storefront:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update storefront",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/storefront - Update storefront (alias for PATCH)
 * Requirements: 9.4
 */
export async function PUT(request: NextRequest) {
  return PATCH(request);
}
