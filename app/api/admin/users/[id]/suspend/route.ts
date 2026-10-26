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
    const { is_suspended } = body;

    // Update user suspension status
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ is_suspended })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If suspending, hide all their listings
    if (is_suspended) {
      await supabase
        .from("listings")
        .update({ is_active: false })
        .eq("user_id", id);
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user suspension:", error);
    return NextResponse.json(
      { error: "Failed to update user suspension" },
      { status: 500 },
    );
  }
}
