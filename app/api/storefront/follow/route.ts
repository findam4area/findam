import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storefrontService } from "@/lib/services/storefront";

/**
 * POST /api/storefront/follow - Follow a storefront
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storefront_id } = await request.json();

    if (!storefront_id) {
      return NextResponse.json(
        { error: "storefront_id is required" },
        { status: 400 },
      );
    }

    await storefrontService.followStorefront(storefront_id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to follow storefront:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to follow storefront",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/storefront/follow - Unfollow a storefront
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storefront_id = searchParams.get("storefront_id");

    if (!storefront_id) {
      return NextResponse.json(
        { error: "storefront_id is required" },
        { status: 400 },
      );
    }

    await storefrontService.unfollowStorefront(storefront_id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unfollow storefront:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to unfollow storefront",
      },
      { status: 500 },
    );
  }
}
