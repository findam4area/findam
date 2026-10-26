import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";
import type { AdminUser, PaginatedResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authCheck = await checkAdminAuth(supabase);

    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search_query = searchParams.get("search_query") || undefined;
    const is_premium = searchParams.get("is_premium");
    const is_suspended = searchParams.get("is_suspended");
    const phone_verified = searchParams.get("phone_verified");
    const nin_verified = searchParams.get("nin_verified");
    const min_trust_score = searchParams.get("min_trust_score");
    const max_trust_score = searchParams.get("max_trust_score");
    const sort_by = searchParams.get("sort_by") || "created_at";
    const sort_order = searchParams.get("sort_order") || "desc";
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    let query = supabase.from("users").select("*", { count: "exact" });

    // Apply filters
    if (search_query) {
      query = query.or(
        `username.ilike.%${search_query}%,email.ilike.%${search_query}%`,
      );
    }
    if (is_premium !== null) {
      query = query.eq("is_premium", is_premium === "true");
    }
    if (is_suspended !== null) {
      query = query.eq("is_suspended", is_suspended === "true");
    }
    if (phone_verified !== null) {
      query = query.eq("phone_verified", phone_verified === "true");
    }
    if (nin_verified !== null) {
      query = query.eq("nin_verified", nin_verified === "true");
    }
    if (min_trust_score) {
      query = query.gte("trust_score", parseInt(min_trust_score));
    }
    if (max_trust_score) {
      query = query.lte("trust_score", parseInt(max_trust_score));
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === "asc" });

    // Apply pagination
    const start = page * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data: users, error, count } = await query;

    if (error) throw error;

    // Fetch additional stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get listings count
        const { count: listingsCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Get active listings count
        const { count: activeListingsCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_active", true);

        // Get reviews count and average rating
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("reviewed_user_id", user.id);

        const reviewsCount = reviews?.length || 0;
        const averageRating =
          reviewsCount > 0
            ? reviews!.reduce((sum, r) => sum + (r.rating || 0), 0) /
              reviewsCount
            : undefined;

        return {
          ...user,
          listings_count: listingsCount || 0,
          active_listings_count: activeListingsCount || 0,
          reviews_count: reviewsCount,
          average_rating: averageRating,
        };
      }),
    );

    const response: PaginatedResponse<AdminUser> = {
      data: usersWithStats as AdminUser[],
      total: count || 0,
      page,
      limit,
      hasMore: count ? start + limit < count : false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
