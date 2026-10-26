import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { likeListing, unlikeListing } from "@/lib/api/interactions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await likeListing(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error liking listing:", error);
    return NextResponse.json(
      { error: error.message || "Failed to like listing" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await unlikeListing(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unliking listing:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unlike listing" },
      { status: 500 },
    );
  }
}
