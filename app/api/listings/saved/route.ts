import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSavedListings } from "@/lib/api/interactions";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listings = await getSavedListings(user.id);

    return NextResponse.json({ data: listings });
  } catch (error: any) {
    console.error("Error fetching saved listings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saved listings" },
      { status: 500 },
    );
  }
}
