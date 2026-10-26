/**
 * Admin API endpoint for category reordering
 * 
 * PATCH /api/admin/categories/[id]/reorder
 * 
 * Updates the display_order of a category. Requires admin authentication.
 * 
 * Requirements: 19.3
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

/**
 * PATCH /api/admin/categories/[id]/reorder
 * 
 * Update category display order
 * 
 * Request body:
 * {
 *   "display_order": number
 * }
 * 
 * Response:
 * {
 *   "category": Category object with updated display_order
 * }
 * 
 * Errors:
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: Category not found
 * - 400: Invalid request body
 * - 500: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const authCheck = await checkAdminAuth(supabase);

    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 },
      );
    }

    const { id } = await params;

    // Parse request body
    const body = await request.json();
    const { display_order } = body;

    // Validate display_order
    if (typeof display_order !== "number" || display_order < 0) {
      return NextResponse.json(
        { error: "display_order must be a non-negative number" },
        { status: 400 },
      );
    }

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabase
      .from("categories")
      .select("id, name, parent_id, display_order")
      .eq("id", id)
      .single();

    if (fetchError || !existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Update category display_order
    const { data: updatedCategory, error: updateError } = await supabase
      .from("categories")
      .update({ display_order })
      .eq("id", id)
      .select(
        `
        id,
        name,
        description,
        icon,
        parent_id,
        display_order,
        is_hidden,
        created_at,
        updated_at
      `,
      )
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      category: updatedCategory,
      message: `Category "${existingCategory.name}" display order updated to ${display_order}`,
    });
  } catch (error) {
    console.error("Category reorder error:", error);
    return NextResponse.json(
      { error: "Failed to update category display order" },
      { status: 500 },
    );
  }
}
