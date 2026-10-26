/**
 * Admin API endpoint for hiding/unhiding categories
 * 
 * PATCH /api/admin/categories/[id]/hide
 * 
 * Sets the is_hidden flag for a category without deleting it.
 * Hidden categories are preserved but not available for new business selection.
 * Existing business assignments to hidden categories are maintained.
 * 
 * Requirements: 19.5, 19.6
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

/**
 * PATCH /api/admin/categories/[id]/hide
 * 
 * Hide or unhide a category
 * 
 * Request body:
 * {
 *   "is_hidden": boolean  // true to hide, false to unhide
 * }
 * 
 * Response:
 * {
 *   "category": Category object with updated is_hidden flag
 *   "message": string
 *   "affected_businesses": number  // Count of businesses assigned to this category
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
    const { is_hidden } = body;

    // Validate is_hidden
    if (typeof is_hidden !== "boolean") {
      return NextResponse.json(
        { error: "is_hidden must be a boolean value" },
        { status: 400 },
      );
    }

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabase
      .from("categories")
      .select("id, name, parent_id, is_hidden")
      .eq("id", id)
      .single();

    if (fetchError || !existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Check if category is already in the desired state
    if (existingCategory.is_hidden === is_hidden) {
      return NextResponse.json(
        {
          category: existingCategory,
          message: `Category "${existingCategory.name}" is already ${is_hidden ? "hidden" : "visible"}`,
          affected_businesses: 0,
        },
        { status: 200 },
      );
    }

    // Count businesses assigned to this category (primary or secondary)
    // Primary category assignments
    const { count: primaryCount, error: primaryCountError } = await supabase
      .from("business_profiles")
      .select("id", { count: "exact", head: true })
      .eq("primary_category_id", id);

    if (primaryCountError) throw primaryCountError;

    // Secondary category assignments (via business_category_tags)
    const { count: secondaryCount, error: secondaryCountError } = await supabase
      .from("business_category_tags")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (secondaryCountError) throw secondaryCountError;

    const totalAffectedBusinesses = (primaryCount || 0) + (secondaryCount || 0);

    // Update category is_hidden flag
    const { data: updatedCategory, error: updateError } = await supabase
      .from("categories")
      .update({ is_hidden })
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
      message: `Category "${existingCategory.name}" has been ${is_hidden ? "hidden" : "unhidden"}. ${totalAffectedBusinesses} business assignment(s) preserved.`,
      affected_businesses: totalAffectedBusinesses,
    });
  } catch (error) {
    console.error("Category hide/unhide error:", error);
    return NextResponse.json(
      { error: "Failed to update category visibility" },
      { status: 500 },
    );
  }
}
