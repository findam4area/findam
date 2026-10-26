import { NextRequest, NextResponse } from "next/server";
import { storefrontService } from "@/lib/services/storefront";

/**
 * GET /api/storefront/[username]
 * Get public storefront by username
 * Requirements: 9.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // Get storefront data by custom URL (username)
    const storefrontData = await storefrontService.getStorefront(username);

    if (!storefrontData) {
      return NextResponse.json(
        { error: "Storefront not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(storefrontData);
  } catch (error) {
    console.error("Failed to get storefront:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch storefront",
      },
      { status: 500 },
    );
  }
}
