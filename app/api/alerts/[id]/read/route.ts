/**
 * Mark Alert as Read API
 * Handles marking individual alerts as read
 */

import { NextRequest, NextResponse } from "next/server";
import { AlertService } from "@/lib/services/alert";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: alert, error: alertError } = await (supabase.from as any)(
      "search_alerts",
    )
      .select("user_id")
      .eq("id", id)
      .single();

    if (alertError || !alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (alert.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await AlertService.markAlertRead(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking alert as read:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark alert as read" },
      { status: 500 },
    );
  }
}
