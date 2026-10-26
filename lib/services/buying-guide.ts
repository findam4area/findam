/**
 * Buying Guide Service
 * Handles buying guide retrieval, search, and bookmarking
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.7, 22.8, 22.9
 */

import { createClient } from "@/lib/supabase/server";

export interface BuyingGuide {
  id: string;
  category_id: string;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  price_ranges: PriceRanges;
  video_url?: string;
  comparison_chart: ComparisonItem[];
  common_scams: string[];
  key_features: string[];
  market_prices: MarketPrices;
  view_count: number;
  bookmark_count: number;
  is_bookmarked?: boolean;
  last_updated_at: Date;
  created_at: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: "physical" | "functional" | "documentation" | "safety";
}

export interface PriceRanges {
  new?: { min: number; max: number };
  excellent?: { min: number; max: number };
  good?: { min: number; max: number };
  fair?: { min: number; max: number };
}

export interface ComparisonItem {
  name: string;
  specs: Record<string, string | number>;
  price_range: { min: number; max: number };
  rating?: number;
}

export interface MarketPrices {
  [itemName: string]: {
    average: number;
    range: { min: number; max: number };
    last_updated: string;
  };
}

export class BuyingGuideService {
  /**
   * Get buying guide by category
   * Requirements: 22.1, 22.3
   */
  static async getGuideByCategory(
    categoryId: string,
    userId?: string,
  ): Promise<BuyingGuide | null> {
    const supabase = await createClient();

    const { data: guide, error } = await (supabase.from as any)("buying_guides")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_published", true)
      .single();

    if (error || !guide) {
      return null;
    }

    // Check if user has bookmarked this guide
    let isBookmarked = false;
    if (userId) {
      const { data: bookmark } = await (supabase.from as any)("guide_bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("guide_id", guide.id)
        .single();

      isBookmarked = !!bookmark;
    }

    // Increment view count
    await (supabase.from as any)("buying_guides")
      .update({ view_count: guide.view_count + 1 })
      .eq("id", guide.id);

    return {
      ...guide,
      is_bookmarked: isBookmarked,
      last_updated_at: new Date(guide.last_updated_at),
      created_at: new Date(guide.created_at),
    };
  }

  /**
   * Get buying guide by ID
   * Requirements: 22.1
   */
  static async getGuideById(
    guideId: string,
    userId?: string,
  ): Promise<BuyingGuide | null> {
    const supabase = await createClient();

    const { data: guide, error } = await (supabase.from as any)("buying_guides")
      .select("*")
      .eq("id", guideId)
      .eq("is_published", true)
      .single();

    if (error || !guide) {
      return null;
    }

    // Check if user has bookmarked this guide
    let isBookmarked = false;
    if (userId) {
      const { data: bookmark } = await (supabase.from as any)("guide_bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("guide_id", guide.id)
        .single();

      isBookmarked = !!bookmark;
    }

    // Increment view count
    await (supabase.from as any)("buying_guides")
      .update({ view_count: guide.view_count + 1 })
      .eq("id", guide.id);

    return {
      ...guide,
      is_bookmarked: isBookmarked,
      last_updated_at: new Date(guide.last_updated_at),
      created_at: new Date(guide.created_at),
    };
  }

  /**
   * Search buying guides
   * Requirements: 22.7
   */
  static async searchGuides(
    query: string,
    limit: number = 10,
  ): Promise<BuyingGuide[]> {
    const supabase = await createClient();

    const { data: guides, error } = await (supabase.from as any)(
      "buying_guides",
    )
      .select("*")
      .eq("is_published", true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("view_count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search guides: ${error.message}`);
    }

    return (guides || []).map((guide: any) => ({
      ...guide,
      last_updated_at: new Date(guide.last_updated_at),
      created_at: new Date(guide.created_at),
    }));
  }

  /**
   * Get all published guides
   * Requirements: 22.1
   */
  static async getAllGuides(userId?: string): Promise<BuyingGuide[]> {
    const supabase = await createClient();

    const { data: guides, error } = await (supabase.from as any)(
      "buying_guides",
    )
      .select("*")
      .eq("is_published", true)
      .order("view_count", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch guides: ${error.message}`);
    }

    // Get user's bookmarks if userId provided
    let bookmarkedIds: string[] = [];
    if (userId) {
      const { data: bookmarks } = await (supabase.from as any)(
        "guide_bookmarks",
      )
        .select("guide_id")
        .eq("user_id", userId);

      bookmarkedIds = (bookmarks || []).map((b: any) => b.guide_id);
    }

    return (guides || []).map((guide: any) => ({
      ...guide,
      is_bookmarked: bookmarkedIds.includes(guide.id),
      last_updated_at: new Date(guide.last_updated_at),
      created_at: new Date(guide.created_at),
    }));
  }

  /**
   * Bookmark a guide
   * Requirements: 22.8
   */
  static async bookmarkGuide(userId: string, guideId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await (supabase.from as any)("guide_bookmarks").insert({
      user_id: userId,
      guide_id: guideId,
    });

    if (error) {
      throw new Error(`Failed to bookmark guide: ${error.message}`);
    }
  }

  /**
   * Remove bookmark from a guide
   * Requirements: 22.8
   */
  static async unbookmarkGuide(userId: string, guideId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await (supabase.from as any)("guide_bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("guide_id", guideId);

    if (error) {
      throw new Error(`Failed to unbookmark guide: ${error.message}`);
    }
  }

  /**
   * Get user's bookmarked guides
   * Requirements: 22.8
   */
  static async getBookmarkedGuides(userId: string): Promise<BuyingGuide[]> {
    const supabase = await createClient();

    const { data: bookmarks, error } = await (supabase.from as any)(
      "guide_bookmarks",
    )
      .select(
        `
        guide_id,
        buying_guides (*)
      `,
      )
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to fetch bookmarked guides: ${error.message}`);
    }

    return (bookmarks || [])
      .filter((b: any) => b.buying_guides)
      .map((b: any) => ({
        ...b.buying_guides,
        is_bookmarked: true,
        last_updated_at: new Date(b.buying_guides.last_updated_at),
        created_at: new Date(b.buying_guides.created_at),
      }));
  }

  /**
   * Get market price estimate for an item
   * Requirements: 22.9
   */
  static getMarketPriceEstimate(
    guide: BuyingGuide,
    itemName: string,
  ): { average: number; range: { min: number; max: number } } | null {
    if (!guide.market_prices || !guide.market_prices[itemName]) {
      return null;
    }

    return {
      average: guide.market_prices[itemName].average,
      range: guide.market_prices[itemName].range,
    };
  }
}
