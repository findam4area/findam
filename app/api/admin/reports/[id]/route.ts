import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const authCheck = await checkAdminAuth(supabase);

    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, admin_notes, action } = body;

    // Get the report first
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*, listing:listings(id, user_id)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Update report status
    const updateData: any = {
      status: status || report.status,
      admin_notes: admin_notes || report.admin_notes,
    };

    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: updatedReport, error: updateError } = await supabase
      .from("reports")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Handle actions on the listing
    if (action === "approve" && report.listing) {
      // Restore listing to public visibility
      await supabase
        .from("listings")
        .update({ is_active: true })
        .eq("id", report.listing.id);
    } else if (action === "remove" && report.listing) {
      // Permanently delete the listing
      await supabase.from("listings").delete().eq("id", report.listing.id);
    }

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 },
    );
  }
}
