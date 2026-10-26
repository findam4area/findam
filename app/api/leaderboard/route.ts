import { NextRequest, NextResponse } from "next/server";
import { gamificationService } from "@/lib/services/gamification";

/**
 * GET /api/leaderboard
 * Return top users by category (sellers/buyers/points)
 * Simplified endpoint for gamification leaderboards
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = (searchParams.get("category") || "points") as
      | "sellers"
      | "buyers"
      | "points";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate category
    const validCategories = ["sellers", "buyers", "points"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 },
      );
    }

    // Get leaderboard data
    const leaderboard = await gamificationService.getLeaderboard(
      category,
      limit + offset,
    );

    // Apply offset
    const paginatedLeaderboard = leaderboard.slice(offset, offset + limit);

    // Get category-specific stats
    const getCategoryLabel = (cat: string) => {
      switch (cat) {
        case "sellers":
          return "Top Sellers";
        case "buyers":
          return "Top Buyers";
        case "points":
          return "Top Contributors";
        default:
          return "Leaderboard";
      }
    };

    const getCategoryMetric = (cat: string) => {
      switch (cat) {
        case "sellers":
          return "items_sold";
        case "buyers":
          return "items_purchased";
        case "points":
          return "total_points";
        default:
          return "total_points";
      }
    };

    // Calculate some stats
    const totalEntries = leaderboard.length;
    const hasMore = totalEntries > offset + limit;

    // Get top 3 for highlights
    const topThree = paginatedLeaderboard.slice(0, 3);

    return NextResponse.json({
      success: true,
      category,
      label: getCategoryLabel(category),
      metric: getCategoryMetric(category),
      pagination: {
        limit,
        offset,
        total: totalEntries,
        has_more: hasMore,
        current_page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil(totalEntries / limit),
      },
      leaderboard: paginatedLeaderboard,
      highlights: {
        top_three: topThree,
        total_users: totalEntries,
      },
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to get leaderboard" },
      { status: 500 },
    );
  }
}
