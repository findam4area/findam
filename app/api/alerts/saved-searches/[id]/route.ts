/**
 * Individual Saved Search API
 * Handles update and delete operations for a specific saved search
 * Requirements: 13.7, 13.8
 */

import { NextRequest, NextResponse } from "next/server";
import { AlertService } from "@/lib/services/alert";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, query, notification_frequency, is_paused } = body;

    // Await params to get the id
    const { id } = await params;

    // Verify ownership
    const { data: search } = await (supabase.from as any)("saved_searches")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!search || search.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (query !== undefined) updates.query = query;
    if (notification_frequency !== undefined)
      updates.notification_frequency = notification_frequency;
    if (is_paused !== undefined) updates.is_paused = is_paused;

    const savedSearch = await AlertService.updateSavedSearch(id, updates);

    return NextResponse.json({ savedSearch });
  } catch (error: any) {
    console.error("Error updating saved search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update saved search" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params to get the id
    const { id } = await params;

    // Verify ownership
    const { data: search } = await (supabase.from as any)("saved_searches")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!search || search.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await AlertService.deleteSavedSearch(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting saved search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete saved search" },
      { status: 500 },
    );
  }
}
