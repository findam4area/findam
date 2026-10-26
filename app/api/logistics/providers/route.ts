/**
 * GET /api/logistics/providers
 * Get all active logistics providers (Requirement 8.1, 8.2)
 */

import { NextResponse } from "next/server";
import { LogisticsService } from "@/lib/services/logistics";

export async function GET() {
  try {
    const providers = await LogisticsService.getProviders();

    return NextResponse.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error("Error fetching logistics providers:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch providers",
      },
      { status: 500 },
    );
  }
}
