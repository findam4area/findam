import { NextRequest, NextResponse } from "next/server";
import { socialShareService } from "@/lib/services/social-share";

/**
 * POST /api/social/share/track
 * Track share views, clicks, or conversions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareUrl, eventType } = body;

    if (!shareUrl || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields: shareUrl, eventType" },
        { status: 400 },
      );
    }

    switch (eventType) {
      case "view":
        await socialShareService.trackShareView(shareUrl);
        break;
      case "click":
        await socialShareService.trackShareClick(shareUrl);
        break;
      case "conversion":
        await socialShareService.trackShareConversion(shareUrl);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid event type. Must be: view, click, or conversion" },
          { status: 400 },
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track share error:", error);
    return NextResponse.json(
      { error: "Failed to track share event" },
      { status: 500 },
    );
  }
}
