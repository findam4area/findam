/**
 * GET /api/moderation/queue
 *
 * Return flagged listings for manual review.
 * Supports pagination and status filtering.
 *
 * Requirements: 6.6
 * Task: 10.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const authError = await requireAdmin(supabase);
    if (authError) return authError;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "pending"; // pending, reviewed, all
    const offset = page * limit;

    // Build query based on status filter
    let query = supabase
      .from("flagged_listings_queue")
      .select("*", { count: "exact" });

    // Apply status filter
    if (status === "pending") {
      // Only show flagged items not yet reviewed
      query = query.is("admin_reviewed", false);
    } else if (status === "reviewed") {
      // Only show reviewed items
      query = query.eq("admin_reviewed", true);
    }
    // 'all' shows everything

    // Apply pagination and ordering
    query = query
      .order("confidence_score", { ascending: false })
      .order("flagged_at", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching moderation queue:", error);
      return NextResponse.json(
        { error: "Failed to fetch moderation queue" },
        { status: 500 },
      );
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0;
    const hasMore = page < totalPages - 1;

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error in moderation queue endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
