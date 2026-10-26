import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";
import type { AdminStats } from "@/lib/types";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const authCheck = await checkAdminAuth(supabase);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 },
      );
    }

    // Fetch total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Fetch active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", thirtyDaysAgo.toISOString());

    // Fetch total listings
    const { count: totalListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true });

    // Fetch active listings
    const { count: activeListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Fetch total revenue from payments
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "success");

    const totalRevenue =
      payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

    // Fetch pending reports
    const { count: pendingReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Fetch suspended users
    const { count: suspendedUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_suspended", true);

    // Fetch premium users
    const { count: premiumUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_premium", true)
      .gt("premium_expires_at", new Date().toISOString());

    const stats: AdminStats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalListings: totalListings || 0,
      activeListings: activeListings || 0,
      totalRevenue,
      pendingReports: pendingReports || 0,
      suspendedUsers: suspendedUsers || 0,
      premiumUsers: premiumUsers || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 },
    );
  }
}
