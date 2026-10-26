import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Performance analytics endpoint
 * Requirements: Performance optimization
 */

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Validate metric data
    if (!metric.name || typeof metric.value !== "number") {
      return NextResponse.json(
        { error: "Invalid metric data" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get user session (optional)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Store performance metric
    const { error } = await (supabase.from as any)(
      "performance_metrics",
    ).insert({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      metric_id: metric.id,
      user_id: session?.user?.id || null,
      user_agent: request.headers.get("user-agent"),
      url: request.headers.get("referer"),
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing performance metric:", error);
      // Don't fail the request if storage fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Performance analytics error:", error);
    return NextResponse.json(
      { error: "Failed to record metric" },
      { status: 500 },
    );
  }
}

/**
 * Get performance analytics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get("metric");
    const period = searchParams.get("period") || "7d";

    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    const daysAgo = period === "7d" ? 7 : period === "30d" ? 30 : 1;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    let query = (supabase.from as any)("performance_metrics")
      .select("*")
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: false });

    if (metric) {
      query = query.eq("name", metric);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate aggregates
    const aggregates = {
      count: data?.length || 0,
      average: 0,
      p50: 0,
      p75: 0,
      p95: 0,
      p99: 0,
      good: 0,
      needsImprovement: 0,
      poor: 0,
    };

    if (data && data.length > 0) {
      const values = data
        .map((m: any) => m.value)
        .sort((a: number, b: number) => a - b);

      aggregates.average =
        values.reduce((a: number, b: number) => a + b, 0) / values.length;
      aggregates.p50 = values[Math.floor(values.length * 0.5)];
      aggregates.p75 = values[Math.floor(values.length * 0.75)];
      aggregates.p95 = values[Math.floor(values.length * 0.95)];
      aggregates.p99 = values[Math.floor(values.length * 0.99)];

      // Count by rating
      data.forEach((m: any) => {
        if (m.rating === "good") aggregates.good++;
        else if (m.rating === "needs-improvement")
          aggregates.needsImprovement++;
        else if (m.rating === "poor") aggregates.poor++;
      });
    }

    return NextResponse.json({
      metrics: data,
      aggregates,
      period,
    });
  } catch (error) {
    console.error("Performance analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
