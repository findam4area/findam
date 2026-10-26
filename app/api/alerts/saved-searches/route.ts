/**
 * Saved Searches API
 * Handles CRUD operations for saved searches
 * Requirements: 13.1, 13.2
 */

import { NextRequest, NextResponse } from "next/server";
import { AlertService } from "@/lib/services/alert";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || user.id;

    // Ensure user can only access their own saved searches
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const savedSearches = await AlertService.getUserSavedSearches(userId);

    return NextResponse.json({ savedSearches });
  } catch (error: any) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saved searches" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, query, notificationFrequency } = body;

    if (!name || !query) {
      return NextResponse.json(
        { error: "Name and query are required" },
        { status: 400 },
      );
    }

    const savedSearch = await AlertService.createSavedSearch({
      userId: user.id,
      name,
      query,
      notificationFrequency,
    });

    return NextResponse.json({ savedSearch }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating saved search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create saved search" },
      { status: 500 },
    );
  }
}
