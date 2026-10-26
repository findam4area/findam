/**
 * Safety Tips API
 * GET /api/meetups/safety-tips - Get safety tips for meetups
 * Requirements: 21.8
 */

import { NextResponse } from "next/server";
import { MeetupService } from "@/lib/services/meetup";

export async function GET() {
  try {
    const tips = MeetupService.getSafetyTips();
    return NextResponse.json({ tips });
  } catch (error) {
    console.error("Error fetching safety tips:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch safety tips",
      },
      { status: 500 },
    );
  }
}
