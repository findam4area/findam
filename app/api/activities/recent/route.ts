import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/activities/recent
 * 
 * Fetch recent platform activities for the activity feed.
 * Requirements: 5.1, 5.6
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch recent activities (10-20 activities)
    const { data: activities, error } = await supabase
      .from("activities")
      .select(
        `
        id,
        type,
        user_name,
        user_avatar,
        description,
        metadata,
        created_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching activities:", error);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      );
    }

    // Type guard: ensure activities is not null
    if (!activities) {
      return NextResponse.json([]);
    }

    // Transform to match Activity interface
    // Requirement 5.6: Anonymize sensitive user information
    const transformedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type as "listing" | "purchase" | "registration" | "review",
      user: {
        name: anonymizeName(activity.user_name),
        avatar: activity.user_avatar || "/images/default-avatar.png",
      },
      description: activity.description,
      timestamp: activity.created_at,
      metadata: activity.metadata || {},
    }));

    return NextResponse.json(transformedActivities);
  } catch (error) {
    console.error("Unexpected error in activities API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Anonymize user names for privacy (Requirement 5.6)
 * Shows first name and first letter of last name
 */
function anonymizeName(fullName: string): string {
  if (!fullName) return "Anonymous User";

  const parts = fullName.trim().split(" ");
  if (parts.length === 1) {
    return parts[0];
  }

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}
