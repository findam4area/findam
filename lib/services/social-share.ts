/**
 * Social Share Service
 * Handles social media sharing, tracking, and promotional content generation
 */

import { createClient } from "@/lib/supabase/client";

export interface ShareMetrics {
  id: string;
  listing_id: string;
  sharer_id: string;
  platform: "whatsapp" | "twitter" | "facebook" | "instagram" | "other";
  share_url: string;
  referral_code?: string;
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  shared_at: string;
}

export interface ShareLinkOptions {
  listingId: string;
  userId: string;
  platform: "whatsapp" | "twitter" | "facebook" | "instagram";
  referralCode?: string;
}

export interface OpenGraphData {
  title: string;
  description: string;
  image: string;
  url: string;
  price?: number;
  condition?: string;
  location?: string;
}

export interface NigerianHashtags {
  general: string[];
  categorySpecific: string[];
  trending: string[];
}

export class SocialShareService {
  private supabase = createClient();

  /**
   * Generate a shareable link with tracking parameters
   */
  async generateShareLink(options: ShareLinkOptions): Promise<string> {
    const { listingId, userId, platform, referralCode } = options;

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "https://findam.ng";

    const params = new URLSearchParams({
      utm_source: platform,
      utm_medium: "social",
      utm_campaign: "listing_share",
      shared_by: userId,
    });

    if (referralCode) {
      params.append("ref", referralCode);
    }

    const shareUrl = `${baseUrl}/listing/${listingId}?${params.toString()}`;

    // Create share metric record
    await this.createShareMetric({
      listing_id: listingId,
      sharer_id: userId,
      platform,
      share_url: shareUrl,
      referral_code: referralCode,
    });

    return shareUrl;
  }

  /**
   * Create a share metric record
   */
  private async createShareMetric(data: {
    listing_id: string;
    sharer_id: string;
    platform: string;
    share_url: string;
    referral_code?: string;
  }): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("share_metrics")
      .insert(data);

    if (error) {
      console.error("Failed to create share metric:", error);
    }
  }

  /**
   * Track a view from a shared link
   */
  async trackShareView(shareUrl: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("share_metrics")
      .update({
        views_count: (this.supabase as any).raw("views_count + 1"),
        last_viewed_at: new Date().toISOString(),
      })
      .eq("share_url", shareUrl);

    if (error) {
      console.error("Failed to track share view:", error);
    }
  }

  /**
   * Track a click from a shared link
   */
  async trackShareClick(shareUrl: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("share_metrics")
      .update({
        clicks_count: (this.supabase as any).raw("clicks_count + 1"),
      })
      .eq("share_url", shareUrl);

    if (error) {
      console.error("Failed to track share click:", error);
    }
  }

  /**
   * Track a conversion from a shared link (signup or purchase)
   */
  async trackShareConversion(shareUrl: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("share_metrics")
      .update({
        conversions_count: (this.supabase as any).raw("conversions_count + 1"),
      })
      .eq("share_url", shareUrl);

    if (error) {
      console.error("Failed to track share conversion:", error);
    }
  }

  /**
   * Get share metrics for a listing
   */
  async getListingShareMetrics(listingId: string): Promise<{
    total_shares: number;
    total_views: number;
    total_clicks: number;
    total_conversions: number;
    by_platform: Record<string, number>;
  }> {
    const { data, error } = await (this.supabase as any)
      .from("share_metrics")
      .select("*")
      .eq("listing_id", listingId);

    if (error || !data) {
      console.error("Failed to get share metrics:", error);
      return {
        total_shares: 0,
        total_views: 0,
        total_clicks: 0,
        total_conversions: 0,
        by_platform: {},
      };
    }

    const metrics = data.reduce(
      (acc: any, share: any) => {
        acc.total_shares += 1;
        acc.total_views += share.views_count || 0;
        acc.total_clicks += share.clicks_count || 0;
        acc.total_conversions += share.conversions_count || 0;
        acc.by_platform[share.platform] =
          (acc.by_platform[share.platform] || 0) + 1;
        return acc;
      },
      {
        total_shares: 0,
        total_views: 0,
        total_clicks: 0,
        total_conversions: 0,
        by_platform: {} as Record<string, number>,
      },
    );

    return metrics;
  }

  /**
   * Get user's share metrics
   */
  async getUserShareMetrics(userId: string): Promise<ShareMetrics[]> {
    const { data, error } = await (this.supabase as any)
      .from("share_metrics")
      .select("*")
      .eq("sharer_id", userId)
      .order("shared_at", { ascending: false });

    if (error) {
      console.error("Failed to get user share metrics:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Generate Open Graph meta tags for a listing
   */
  generateOpenGraphTags(data: OpenGraphData): Record<string, string> {
    const tags: Record<string, string> = {
      "og:type": "product",
      "og:title": data.title,
      "og:description": data.description,
      "og:image": data.image,
      "og:url": data.url,
      "og:site_name": "FindAm",
      "twitter:card": "summary_large_image",
      "twitter:title": data.title,
      "twitter:description": data.description,
      "twitter:image": data.image,
    };

    if (data.price !== undefined && data.price !== null) {
      tags["product:price:amount"] = data.price.toString();
      tags["product:price:currency"] = "NGN";
    }

    if (data.condition) {
      tags["product:condition"] = data.condition;
    }

    if (data.location) {
      tags["og:locality"] = data.location;
    }

    return tags;
  }

  /**
   * Get platform-specific share URL
   */
  getPlatformShareUrl(
    platform: string,
    shareUrl: string,
    text: string,
  ): string {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);

    switch (platform) {
      case "whatsapp":
        return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;

      case "twitter":
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

      case "instagram":
        // Instagram doesn't support direct sharing via URL, return the share URL for copying
        return shareUrl;

      default:
        return shareUrl;
    }
  }

  /**
   * Get Nigerian market hashtags for a category
   */
  getNigerianHashtags(category: string): NigerianHashtags {
    const generalHashtags = [
      "#NaijaMarket",
      "#BuyNaija",
      "#NigerianMarketplace",
      "#LagosMarket",
      "#NaijaDeals",
      "#MadeInNigeria",
      "#SupportLocal",
      "#NaijaEntrepreneur",
    ];

    const categoryHashtags: Record<string, string[]> = {
      electronics: ["#NaijaTech", "#TechNaija", "#GadgetsNG", "#PhoneNaija"],
      fashion: [
        "#NaijaFashion",
        "#AsoEbi",
        "#AnkaraStyle",
        "#NaijaStyle",
        "#AfricanFashion",
      ],
      vehicles: ["#NaijaCars", "#CarsNG", "#AutoNaija", "#TokunboNG"],
      "home-garden": ["#NaijaHomes", "#HomeDecorNG", "#FurnitureNG"],
      phones: ["#PhoneNaija", "#SmartphonesNG", "#MobileNG", "#TechDeals"],
      laptops: ["#LaptopsNG", "#ComputersNG", "#TechNaija"],
      beauty: ["#NaijaBeauty", "#BeautyNG", "#MakeupNaija", "#GlowNG"],
      sports: ["#SportsNG", "#FitnessNaija", "#NaijaFit"],
    };

    const trendingHashtags = [
      "#FindAm",
      "#ShopLocal",
      "#NaijaHustle",
      "#SmallBusiness",
      "#Entrepreneur",
    ];

    return {
      general: generalHashtags,
      categorySpecific: categoryHashtags[category] || [],
      trending: trendingHashtags,
    };
  }

  /**
   * Generate share text with hashtags
   */
  generateShareText(listing: {
    title: string;
    price: number;
    category?: string;
    condition?: string;
  }): string {
    const { title, price, category, condition } = listing;

    const priceText = `₦${price.toLocaleString()}`;
    const conditionText = condition ? ` (${condition})` : "";

    const hashtags = this.getNigerianHashtags(category || "general");
    const selectedHashtags = [
      ...hashtags.trending.slice(0, 2),
      ...hashtags.categorySpecific.slice(0, 2),
      ...hashtags.general.slice(0, 2),
    ].join(" ");

    return `Check out this ${title}${conditionText} for ${priceText}! ${selectedHashtags}`;
  }

  /**
   * Generate story-format image data URL
   * Returns a data structure that can be used to create an image
   */
  generateStoryImageData(listing: {
    title: string;
    price: number;
    image_url: string;
    condition?: string;
  }): {
    width: number;
    height: number;
    background: string;
    elements: Array<{
      type: "image" | "text";
      content: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      fontSize?: number;
      fontWeight?: string;
      color?: string;
      align?: string;
    }>;
  } {
    return {
      width: 1080,
      height: 1920,
      background: "#1a1a1a",
      elements: [
        {
          type: "image",
          content: listing.image_url,
          x: 0,
          y: 300,
          width: 1080,
          height: 1080,
        },
        {
          type: "text",
          content: listing.title,
          x: 540,
          y: 150,
          fontSize: 48,
          fontWeight: "bold",
          color: "#ffffff",
          align: "center",
        },
        {
          type: "text",
          content: `₦${listing.price.toLocaleString()}`,
          x: 540,
          y: 1500,
          fontSize: 72,
          fontWeight: "bold",
          color: "#00ff88",
          align: "center",
        },
        {
          type: "text",
          content: listing.condition || "Available Now",
          x: 540,
          y: 1600,
          fontSize: 36,
          color: "#cccccc",
          align: "center",
        },
        {
          type: "text",
          content: "FindAm.ng",
          x: 540,
          y: 1800,
          fontSize: 32,
          color: "#ffffff",
          align: "center",
        },
      ],
    };
  }

  /**
   * Generate promotional graphic data with QR code
   */
  generatePromotionalGraphicData(listing: {
    title: string;
    price: number;
    image_url: string;
    listing_url: string;
    seller_name: string;
  }): {
    width: number;
    height: number;
    background: string;
    elements: Array<{
      type: "image" | "text" | "qr";
      content: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      fontSize?: number;
      fontWeight?: string;
      color?: string;
      align?: string;
    }>;
  } {
    return {
      width: 1200,
      height: 630,
      background: "#ffffff",
      elements: [
        {
          type: "image",
          content: listing.image_url,
          x: 50,
          y: 50,
          width: 530,
          height: 530,
        },
        {
          type: "text",
          content: listing.title,
          x: 650,
          y: 100,
          fontSize: 42,
          fontWeight: "bold",
          color: "#1a1a1a",
          align: "left",
        },
        {
          type: "text",
          content: `₦${listing.price.toLocaleString()}`,
          x: 650,
          y: 200,
          fontSize: 56,
          fontWeight: "bold",
          color: "#00aa66",
          align: "left",
        },
        {
          type: "text",
          content: `Sold by ${listing.seller_name}`,
          x: 650,
          y: 300,
          fontSize: 24,
          color: "#666666",
          align: "left",
        },
        {
          type: "qr",
          content: listing.listing_url,
          x: 900,
          y: 350,
          width: 200,
          height: 200,
        },
        {
          type: "text",
          content: "Scan to view",
          x: 1000,
          y: 570,
          fontSize: 18,
          color: "#666666",
          align: "center",
        },
      ],
    };
  }

  /**
   * Get weekly highlights for a seller
   */
  async getWeeklyHighlights(userId: string): Promise<{
    total_views: number;
    total_sales: number;
    top_listing: any;
    total_shares: number;
    week_start: string;
    week_end: string;
  } | null> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weekEnd = new Date();

    // Get user's listings
    const { data: listings, error: listingsError } = await (
      this.supabase as any
    )
      .from("listings")
      .select("id, title, price, views_count, images")
      .eq("user_id", userId)
      .gte("created_at", weekStart.toISOString());

    if (listingsError || !listings || listings.length === 0) {
      return null;
    }

    const listingIds = listings.map((l: any) => l.id);

    // Get share metrics for the week
    const { data: shares } = await (this.supabase as any)
      .from("share_metrics")
      .select("*")
      .in("listing_id", listingIds)
      .gte("shared_at", weekStart.toISOString());

    // Get sales for the week (assuming purchase_records table)
    const { data: sales } = await (this.supabase as any)
      .from("purchase_records")
      .select("*")
      .eq("seller_id", userId)
      .gte("purchased_at", weekStart.toISOString());

    const totalViews = listings.reduce(
      (sum: number, l: any) => sum + (l.views_count || 0),
      0,
    );
    const totalShares = shares?.length || 0;
    const totalSales = sales?.length || 0;

    // Find top listing by views
    const topListing = listings.reduce((top: any, current: any) =>
      (current.views_count || 0) > (top.views_count || 0) ? current : top,
    );

    return {
      total_views: totalViews,
      total_sales: totalSales,
      top_listing: topListing,
      total_shares: totalShares,
      week_start: weekStart.toISOString(),
      week_end: weekEnd.toISOString(),
    };
  }
}

export const socialShareService = new SocialShareService();
