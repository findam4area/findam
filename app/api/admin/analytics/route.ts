import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";
import type { CategoryStats, ConversionStats } from "@/lib/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const authCheck = await checkAdminAuth(supabase);

    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 },
      );
    }

    // Fetch category statistics
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name");

    const categoryStats: CategoryStats[] = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("category_id", category.id);

        return {
          category_id: category.id,
          category_name: category.name,
          listing_count: count || 0,
          percentage: 0, // Will calculate after getting total
        };
      }),
    );

    // Calculate percentages
    const totalListings = categoryStats.reduce(
      (sum, stat) => sum + stat.listing_count,
      0,
    );
    categoryStats.forEach((stat) => {
      stat.percentage =
        totalListings > 0 ? (stat.listing_count / totalListings) * 100 : 0;
    });

    // Sort by listing count
    categoryStats.sort((a, b) => b.listing_count - a.listing_count);

    // Fetch conversion statistics
    const { data: boostPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("payment_type", "boost")
      .eq("status", "success");

    const { data: premiumPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("payment_type", "premium")
      .eq("status", "success");

    const totalBoosts = boostPayments?.length || 0;
    const totalPremiumSubscriptions = premiumPayments?.length || 0;
    const boostRevenue =
      boostPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const premiumRevenue =
      premiumPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Calculate conversion rate (premium subscriptions / total users)
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const conversionRate =
      totalUsers && totalUsers > 0
        ? (totalPremiumSubscriptions / totalUsers) * 100
        : 0;

    const conversionStats: ConversionStats = {
      total_boosts: totalBoosts,
      total_premium_subscriptions: totalPremiumSubscriptions,
      boost_revenue: boostRevenue,
      premium_revenue: premiumRevenue,
      conversion_rate: conversionRate,
    };

    return NextResponse.json({
      categoryStats,
      conversionStats,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
