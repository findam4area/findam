import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";
import type { Report, PaginatedResponse } from "@/lib/types";

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
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    let query = supabase
      .from("reports")
      .select(
        `
        *,
        reporter:users!reports_reporter_id_fkey(id, username, avatar_url, email),
        listing:listings(id, title, thumbnail_url, user_id, is_active)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    // Apply status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    const start = page * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) throw error;

    const response: PaginatedResponse<Report> = {
      data: (data as unknown as Report[]) || [],
      total: count || 0,
      page,
      limit,
      hasMore: count ? start + limit < count : false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}
