import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/api/notifications";

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getNotificationPreferences(user.id);

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          user_id: user.id,
          new_listing: true,
          new_message: true,
          listing_interactions: true,
          payment_updates: true,
          admin_updates: true,
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for the authenticated user
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const preferences = await updateNotificationPreferences(user.id, {
      new_listing: body.new_listing,
      new_message: body.new_message,
      listing_interactions: body.listing_interactions,
      payment_updates: body.payment_updates,
      admin_updates: body.admin_updates,
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 },
    );
  }
}
