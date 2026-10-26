// Trending Sounds API Endpoints
// Task 70.3 & 70.4: GET/POST /api/trending-sounds

import { NextRequest, NextResponse } from "next/server";
import { TrendingSoundsService } from "@/lib/services/trending-sounds";

const soundsService = new TrendingSoundsService();

// GET /api/trending-sounds - Get all sounds or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { sounds, total } = await soundsService.getAllSounds({
      category,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ sounds, total }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching sounds:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sounds" },
      { status: 500 },
    );
  }
}

// POST /api/trending-sounds - Upload new sound
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, artist, audio_url, duration_seconds, category, tags } = body;

    // Validation
    if (!title || !audio_url) {
      return NextResponse.json(
        { error: "Title and audio URL are required" },
        { status: 400 },
      );
    }

    const sound = await soundsService.createSound({
      title,
      artist,
      audio_url,
      duration_seconds,
      category,
      tags: tags || [],
    });

    return NextResponse.json({ sound }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sound:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sound" },
      { status: 500 },
    );
  }
}
