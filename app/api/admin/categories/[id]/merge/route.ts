import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/categories/[id]/merge
 * 
 * Merge a source category into a target category
 * Task 23.2: CategoryManagementTable component
 * Requirement 19.4: Allow administrators to merge duplicate subcategories
 * 
 * This endpoint:
 * - Validates that both source and target categories exist
 * - Moves all businesses from source to target category
 * - Optionally deletes the source category after merge
 * - Returns the count of businesses moved
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // For now, we assume the middleware or layout has verified admin status

    const { id: sourceCategoryId } = await params;
    const body = await request.json();
    const { target_category_id } = body;

    // Validate input
    if (!target_category_id) {
      return NextResponse.json(
        { error: "target_category_id is required" },
        { status: 400 }
      );
    }

    if (sourceCategoryId === target_category_id) {
      return NextResponse.json(
        { error: "Cannot merge a category into itself" },
        { status: 400 }
      );
    }

    // Verify both categories exist
    const { data: sourceCategory, error: sourceError } = await supabase
      .from("categories")
      .select("id, name, parent_id")
      .eq("id", sourceCategoryId)
      .single();

    if (sourceError || !sourceCategory) {
      return NextResponse.json(
        { error: "Source category not found" },
        { status: 404 }
      );
    }

    const { data: targetCategory, error: targetError } = await supabase
      .from("categories")
      .select("id, name, parent_id")
      .eq("id", target_category_id)
      .single();

    if (targetError || !targetCategory) {
      return NextResponse.json(
        { error: "Target category not found" },
        { status: 404 }
      );
    }

    // Count businesses in source category before merge
    const { count: businessCount } = await supabase
      .from("business_profiles")
      .select("*", { count: "exact", head: true })
      .eq("primary_category_id", sourceCategoryId);

    const { count: tagCount } = await supabase
      .from("business_category_tags")
      .select("*", { count: "exact", head: true })
      .eq("category_id", sourceCategoryId);

    const totalBusinesses = (businessCount || 0) + (tagCount || 0);

    // Update all business profiles that have source as primary category
    const { error: updatePrimaryError } = await supabase
      .from("business_profiles")
      .update({ primary_category_id: target_category_id })
      .eq("primary_category_id", sourceCategoryId);

    if (updatePrimaryError) {
      console.error("Error updating primary categories:", updatePrimaryError);
      return NextResponse.json(
        { error: "Failed to update primary categories" },
        { status: 500 }
      );
    }

    // Update all business category tags that reference the source category
    const { error: updateTagsError } = await supabase
      .from("business_category_tags")
      .update({ category_id: target_category_id })
      .eq("category_id", sourceCategoryId);

    if (updateTagsError) {
      console.error("Error updating category tags:", updateTagsError);
      return NextResponse.json(
        { error: "Failed to update category tags" },
        { status: 500 }
      );
    }

    // Optionally delete the source category
    // (commented out to prevent accidental deletion - uncomment if needed)
    // const { error: deleteError } = await supabase
    //   .from("categories")
    //   .delete()
    //   .eq("id", sourceCategoryId);
    //
    // if (deleteError) {
    //   console.error("Error deleting source category:", deleteError);
    // }

    // Instead of deleting, hide the source category
    const { error: hideError } = await supabase
      .from("categories")
      .update({ is_hidden: true })
      .eq("id", sourceCategoryId);

    if (hideError) {
      console.error("Error hiding source category:", hideError);
    }

    return NextResponse.json({
      success: true,
      businesses_moved: totalBusinesses,
      source_category: sourceCategory.name,
      target_category: targetCategory.name,
      message: `Successfully merged ${sourceCategory.name} into ${targetCategory.name}. ${totalBusinesses} business(es) moved.`,
    });
  } catch (error) {
    console.error("Error merging categories:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
