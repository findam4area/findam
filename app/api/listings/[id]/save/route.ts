import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveListing, unsaveListing } from "@/lib/api/interactions";

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

    await saveListing(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving listing:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save listing" },
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

    await unsaveListing(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unsaving listing:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unsave listing" },
      { status: 500 },
    );
  }
}
