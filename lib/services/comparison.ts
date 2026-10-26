/**
 * Comparison Service
 * Handles product comparison operations including adding/removing listings and validation
 * Requirements: 3.1, 3.6, 3.7, 3.8, 3.10
 * Tasks: 21.2
 */

import { createClient } from "@/lib/supabase/server";
import type {
  ComparisonSet,
  CreateComparisonSetRequest,
  UpdateComparisonSetRequest,
  Listing,
} from "@/lib/types";

export class ComparisonService {
  /**
   * Add a listing to comparison set
   * Requirements: 3.1, 3.6, 3.10
   *
   * Validates:
   * - 2-4 listing limit (Requirement 3.1)
   * - All listings in same category (Requirement 3.10)
   */
  async addToComparison(
    userId: string,
    listingId: string,
    comparisonSetId?: string,
  ): Promise<ComparisonSet> {
    const supabase = await createClient();

    // Get the listing to validate it exists and get its category
    const { data: listing, error: listingError } = await (supabase as any)
      .from("listings")
      .select("id, category_id, is_active")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found");
    }

    if (!listing.is_active) {
      throw new Error("Cannot add inactive listing to comparison");
    }

    // If comparisonSetId provided, update existing set
    if (comparisonSetId) {
      const { data: existingSet, error: fetchError } = await (supabase as any)
        .from("comparison_sets")
        .select("*")
        .eq("id", comparisonSetId)
        .eq("user_id", userId)
        .single();

      if (fetchError || !existingSet) {
        throw new Error("Comparison set not found");
      }

      // Validate category match (Requirement 3.10)
      if (existingSet.category_id !== listing.category_id) {
        throw new Error(
          "Cannot add listing from different category to comparison",
        );
      }

      const currentListingIds = existingSet.listing_ids as string[];

      // Check if already in comparison
      if (currentListingIds.includes(listingId)) {
        throw new Error("Listing already in comparison");
      }

      // Validate 2-4 listing limit (Requirement 3.1)
      if (currentListingIds.length >= 4) {
        throw new Error("Maximum 4 listings allowed in comparison");
      }

      const updatedListingIds = [...currentListingIds, listingId];

      // Update the comparison set
      const { data: updatedSet, error: updateError } = await (supabase as any)
        .from("comparison_sets")
        .update({
          listing_ids: updatedListingIds,
        })
        .eq("id", comparisonSetId)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update comparison: ${updateError.message}`);
      }

      return updatedSet as ComparisonSet;
    }

    // Create new comparison set with this listing
    const { data: newSet, error: createError } = await (supabase as any)
      .from("comparison_sets")
      .insert({
        user_id: userId,
        listing_ids: [listingId],
        category_id: listing.category_id,
        is_saved: false,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create comparison: ${createError.message}`);
    }

    return newSet as ComparisonSet;
  }

  /**
   * Remove a listing from comparison set
   * Requirements: 3.1, 3.6
   */
  async removeFromComparison(
    userId: string,
    comparisonSetId: string,
    listingId: string,
  ): Promise<ComparisonSet | null> {
    const supabase = await createClient();

    // Get existing comparison set
    const { data: existingSet, error: fetchError } = await (supabase as any)
      .from("comparison_sets")
      .select("*")
      .eq("id", comparisonSetId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingSet) {
      throw new Error("Comparison set not found");
    }

    const currentListingIds = existingSet.listing_ids as string[];

    // Remove the listing
    const updatedListingIds = currentListingIds.filter(
      (id: string) => id !== listingId,
    );

    // If less than 2 listings remain, delete the comparison set
    if (updatedListingIds.length < 2) {
      const { error: deleteError } = await (supabase as any)
        .from("comparison_sets")
        .delete()
        .eq("id", comparisonSetId)
        .eq("user_id", userId);

      if (deleteError) {
        throw new Error(`Failed to delete comparison: ${deleteError.message}`);
      }

      return null;
    }

    // Update the comparison set
    const { data: updatedSet, error: updateError } = await (supabase as any)
      .from("comparison_sets")
      .update({
        listing_ids: updatedListingIds,
      })
      .eq("id", comparisonSetId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update comparison: ${updateError.message}`);
    }

    return updatedSet as ComparisonSet;
  }

  /**
   * Get comparison set with full listing details
   * Requirements: 3.1, 3.4
   */
  async getComparisonSet(
    userId: string,
    comparisonSetId: string,
  ): Promise<ComparisonSet | null> {
    const supabase = await createClient();

    const { data: comparisonSet, error } = await (supabase as any)
      .from("comparison_sets")
      .select("*")
      .eq("id", comparisonSetId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch comparison: ${error.message}`);
    }

    return comparisonSet as ComparisonSet;
  }

  /**
   * Get all comparison sets for a user
   * Requirements: 3.7, 3.8
   */
  async getUserComparisonSets(
    userId: string,
    savedOnly: boolean = false,
  ): Promise<ComparisonSet[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("comparison_sets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (savedOnly) {
      query = query.eq("is_saved", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch comparisons: ${error.message}`);
    }

    return (data || []) as ComparisonSet[];
  }

  /**
   * Save a comparison set for later review
   * Requirements: 3.8
   */
  async saveComparisonSet(
    userId: string,
    comparisonSetId: string,
    name: string,
  ): Promise<ComparisonSet> {
    const supabase = await createClient();

    if (!name || name.trim().length === 0) {
      throw new Error("Comparison name is required");
    }

    if (name.length > 100) {
      throw new Error("Comparison name must be 100 characters or less");
    }

    const { data: updatedSet, error } = await (supabase as any)
      .from("comparison_sets")
      .update({
        is_saved: true,
        name: name.trim(),
      })
      .eq("id", comparisonSetId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save comparison: ${error.message}`);
    }

    return updatedSet as ComparisonSet;
  }

  /**
   * Delete a comparison set
   * Requirements: 3.6
   */
  async deleteComparisonSet(
    userId: string,
    comparisonSetId: string,
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .from("comparison_sets")
      .delete()
      .eq("id", comparisonSetId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete comparison: ${error.message}`);
    }
  }

  /**
   * Get listings with full details for comparison
   * Requirements: 3.4
   */
  async getComparisonListings(listingIds: string[]): Promise<Listing[]> {
    const supabase = await createClient();

    const { data: listings, error } = await (supabase as any)
      .from("listings")
      .select(
        `
        *,
        listing_media (*),
        users!listings_user_id_fkey (
          id,
          username,
          avatar_url,
          trust_score
        ),
        categories (
          id,
          name
        )
      `,
      )
      .in("id", listingIds)
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }

    // Return listings in the same order as listingIds
    const orderedListings = listingIds
      .map((id) => listings?.find((l: any) => l.id === id))
      .filter(Boolean);

    return orderedListings as Listing[];
  }

  /**
   * Validate that all listings are in the same category
   * Requirements: 3.10
   */
  async validateSameCategory(listingIds: string[]): Promise<boolean> {
    const supabase = await createClient();

    const { data: listings, error } = await (supabase as any)
      .from("listings")
      .select("category_id")
      .in("id", listingIds);

    if (error || !listings || listings.length === 0) {
      return false;
    }

    // Check if all listings have the same category_id
    const firstCategoryId = listings[0].category_id;
    return listings.every(
      (listing: any) => listing.category_id === firstCategoryId,
    );
  }

  /**
   * Create a new comparison set with multiple listings
   * Requirements: 3.1, 3.10
   */
  async createComparisonSet(
    request: CreateComparisonSetRequest,
  ): Promise<ComparisonSet> {
    const supabase = await createClient();

    // Validate listing count (2-4)
    if (request.listing_ids.length < 2 || request.listing_ids.length > 4) {
      throw new Error("Comparison must include 2-4 listings");
    }

    // Validate all listings exist and are active
    const { data: listings, error: listingsError } = await (supabase as any)
      .from("listings")
      .select("id, category_id, is_active")
      .in("id", request.listing_ids);

    if (
      listingsError ||
      !listings ||
      listings.length !== request.listing_ids.length
    ) {
      throw new Error("One or more listings not found");
    }

    // Check all listings are active
    const inactiveListings = listings.filter((l: any) => !l.is_active);
    if (inactiveListings.length > 0) {
      throw new Error("Cannot compare inactive listings");
    }

    // Validate same category (Requirement 3.10)
    const firstCategoryId = listings[0].category_id;
    const allSameCategory = listings.every(
      (l: any) => l.category_id === firstCategoryId,
    );

    if (!allSameCategory) {
      throw new Error("All listings must be in the same category");
    }

    // Create comparison set
    const { data: newSet, error: createError } = await (supabase as any)
      .from("comparison_sets")
      .insert({
        user_id: request.user_id,
        listing_ids: request.listing_ids,
        category_id: firstCategoryId,
        name: request.name,
        is_saved: request.is_saved || false,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create comparison: ${createError.message}`);
    }

    return newSet as ComparisonSet;
  }

  /**
   * Update a comparison set
   * Requirements: 3.1, 3.6, 3.10
   */
  async updateComparisonSet(
    userId: string,
    comparisonSetId: string,
    updates: UpdateComparisonSetRequest,
  ): Promise<ComparisonSet> {
    const supabase = await createClient();

    // Get existing comparison set
    const { data: existingSet, error: fetchError } = await (supabase as any)
      .from("comparison_sets")
      .select("*")
      .eq("id", comparisonSetId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingSet) {
      throw new Error("Comparison set not found");
    }

    // Validate listing_ids if provided
    if (updates.listing_ids) {
      if (updates.listing_ids.length < 2 || updates.listing_ids.length > 4) {
        throw new Error("Comparison must include 2-4 listings");
      }

      // Validate same category
      const isValid = await this.validateSameCategory(updates.listing_ids);
      if (!isValid) {
        throw new Error("All listings must be in the same category");
      }
    }

    // Validate name if saving
    if (updates.is_saved && !updates.name && !existingSet.name) {
      throw new Error("Name is required for saved comparisons");
    }

    // Update the comparison set
    const { data: updatedSet, error: updateError } = await (supabase as any)
      .from("comparison_sets")
      .update({
        listing_ids: updates.listing_ids,
        name: updates.name,
        is_saved: updates.is_saved,
      })
      .eq("id", comparisonSetId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update comparison: ${updateError.message}`);
    }

    return updatedSet as ComparisonSet;
  }
}

// Export singleton instance
export const comparisonService = new ComparisonService();
