// Trending Sounds - Get Trending
// GET /api/trending-sounds/trending - Get trending sounds

import { NextRequest, NextResponse } from "next/server";
import { TrendingSoundsService } from "@/lib/services/trending-sounds";

const soundsService = new TrendingSoundsService();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");

    const sounds = await soundsService.getTrendingSounds(limit, category);

    return NextResponse.json({ sounds }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching trending sounds:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trending sounds" },
      { status: 500 },
    );
  }
}
