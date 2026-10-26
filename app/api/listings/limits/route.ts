import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getListingLimits, isPremiumActive } from "@/lib/utils/premium";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user premium status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if premium is active
    const isPremium = isPremiumActive({
      is_premium: userData.is_premium ?? false,
      premium_expires_at: userData.premium_expires_at,
    });

    // Get current active listings count
    const { count, error: countError } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to get listings count" },
        { status: 500 },
      );
    }

    const currentCount = count || 0;
    const limits = getListingLimits(isPremium, currentCount);

    return NextResponse.json({
      is_premium: isPremium,
      ...limits,
    });
  } catch (error) {
    console.error("Listing limits error:", error);
    return NextResponse.json(
      { error: "Failed to get listing limits" },
      { status: 500 },
    );
  }
}
