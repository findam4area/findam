/**
 * Content Moderation Service
 *
 * Comprehensive AI-powered content moderation for listings.
 * Scans text, images, pricing, and detects duplicates and scam indicators.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 * Task: 9.1, 9.4, 9.6, 9.8
 */

import {
  scanTextContent,
  scanMultipleFields,
  detectScamIndicators,
  detectPriceAnomaly,
  type ModerationScanResult,
  type Violation,
} from "./openai-moderation";
import { createClient } from "@/lib/supabase/server";
import type {
  ModerationResultInsert,
  ModerationAction,
  ScannedContent,
} from "@/types/moderation";

/**
 * Listing data for moderation scanning
 */
export interface ListingForModeration {
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  userId: string;
}

/**
 * Comprehensive moderation result
 */
export interface ComprehensiveModerationResult {
  approved: boolean;
  confidence: number;
  action: ModerationAction;
  violations: Violation[];
  scannedContent: ScannedContent;
  isDuplicate?: boolean;
  duplicateListingId?: string;
}

/**
 * Content Moderation Service
 *
 * Provides comprehensive moderation for marketplace listings including:
 * - Text content scanning (title, description)
 * - Image content scanning
 * - Scam indicator detection
 * - Price anomaly detection
 * - Duplicate listing detection
 * - Confidence-based actions (auto-reject, flag, approve)
 */
export class ContentModerationService {
  /**
   * Scan a listing comprehensively for all moderation issues
   *
   * This is the main entry point for listing moderation.
   * It performs all checks and returns a comprehensive result.
   *
   * Requirements: 6.1, 6.2, 6.4, 6.7
   *
   * @param listing - Listing data to scan
   * @returns Comprehensive moderation result
   */
  async scanListing(
    listing: ListingForModeration,
  ): Promise<ComprehensiveModerationResult> {
    const violations: Violation[] = [];
    let maxConfidence = 0;

    // 1. Scan text content (title + description)
    // Requirement 6.1: Scan title and description for prohibited content
    const textResult = await scanMultipleFields({
      title: listing.title,
      description: listing.description,
    });

    if (textResult.violations.length > 0) {
      violations.push(...textResult.violations);
      maxConfidence = Math.max(maxConfidence, textResult.confidence);
    }

    // 2. Detect scam indicators
    // Requirement 6.2: Detect scam indicators (unrealistic prices, suspicious language)
    const scamCheck = detectScamIndicators(
      `${listing.title} ${listing.description}`,
    );

    if (scamCheck.hasScamIndicators) {
      violations.push({
        type: "scam_indicators",
        severity: scamCheck.confidence > 75 ? "high" : "medium",
        details: `Potential scam detected: ${scamCheck.indicators.join(", ")}`,
        confidence: scamCheck.confidence,
      });
      maxConfidence = Math.max(maxConfidence, scamCheck.confidence);
    }

    // 3. Detect price anomalies
    // Requirement 6.2: Detect unrealistic prices
    const priceCheck = detectPriceAnomaly(
      listing.price,
      listing.category,
      undefined, // TODO: Fetch category average from database
    );

    if (priceCheck.isAnomalous) {
      violations.push({
        type: "price_anomaly",
        severity: priceCheck.confidence > 75 ? "high" : "medium",
        details: priceCheck.reason,
        confidence: priceCheck.confidence,
      });
      maxConfidence = Math.max(maxConfidence, priceCheck.confidence);
    }

    // 4. Scan images for inappropriate content
    // Requirement 6.7: Scan images for inappropriate content
    if (listing.images && listing.images.length > 0) {
      const imageResult = await this.scanImages(listing.images);
      if (imageResult.violations.length > 0) {
        violations.push(...imageResult.violations);
        maxConfidence = Math.max(maxConfidence, imageResult.confidence);
      }
    }

    // 5. Check for duplicate listings
    // Requirement 6.3: Identify duplicate listings (≥95% similarity)
    if (listing.id) {
      const duplicateCheck = await this.checkDuplicates(
        listing.id,
        listing.userId,
        listing.title,
        listing.description,
      );

      if (duplicateCheck.isDuplicate && duplicateCheck.similarity) {
        violations.push({
          type: "duplicate_listing",
          severity: "medium",
          details: `Duplicate of listing ${duplicateCheck.duplicateListingId} (${duplicateCheck.similarity}% similar)`,
          confidence: duplicateCheck.similarity,
        });
        maxConfidence = Math.max(maxConfidence, duplicateCheck.similarity);
      }
    }

    // 6. Determine action based on confidence
    // Requirement 6.5: Flag for manual review (60-85% confidence)
    // Requirement 6.6: Auto-reject (>85% confidence)
    const action = this.determineAction(maxConfidence, violations.length > 0);
    const approved = action === "approve";

    // Store scanned content for audit trail
    const scannedContent: ScannedContent = {
      title: listing.title,
      description: listing.description,
      images: listing.images,
      price: listing.price,
      category: listing.category,
    };

    return {
      approved,
      confidence: maxConfidence,
      action,
      violations,
      scannedContent,
    };
  }

  /**
   * Scan images for inappropriate content
   *
   * Uses OpenAI Vision API to analyze images for prohibited content.
   *
   * Requirement 6.7: Scan images for inappropriate content
   *
   * @param imageUrls - Array of image URLs to scan
   * @returns Moderation result for images
   */
  private async scanImages(imageUrls: string[]): Promise<ModerationScanResult> {
    const violations: Violation[] = [];
    let maxConfidence = 0;

    try {
      // Import OpenAI dynamically to avoid issues if not configured
      const OpenAI = (await import("openai")).default;
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.warn("OpenAI API key not configured, skipping image scanning");
        return {
          approved: true,
          confidence: 0,
          action: "approve",
          violations: [],
        };
      }

      const openai = new OpenAI({ apiKey });

      // Scan each image (limit to first 3 for performance)
      const imagesToScan = imageUrls.slice(0, 3);

      for (const imageUrl of imagesToScan) {
        try {
          // Use GPT-4 Vision to analyze the image
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analyze this image for inappropriate content including: nudity, violence, weapons, drugs, hate symbols, or scam indicators. Respond with JSON: {inappropriate: boolean, categories: string[], confidence: number (0-100), reason: string}",
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageUrl },
                  },
                ],
              },
            ],
            max_tokens: 300,
          });

          const content = response.choices[0]?.message?.content;
          if (!content) continue;

          // Parse the response
          try {
            const result = JSON.parse(content);

            if (result.inappropriate) {
              violations.push({
                type: "inappropriate_image",
                severity:
                  result.confidence > 75
                    ? "high"
                    : result.confidence > 50
                      ? "medium"
                      : "low",
                details: `Image contains inappropriate content: ${result.reason}`,
                confidence: result.confidence,
              });
              maxConfidence = Math.max(maxConfidence, result.confidence);
            }
          } catch (parseError) {
            console.error("Error parsing image scan result:", parseError);
          }
        } catch (imageError) {
          console.error("Error scanning image:", imageError);
          // Continue with other images
        }
      }
    } catch (error) {
      console.error("Error in image scanning:", error);
      // Don't fail the entire moderation if image scanning fails
    }

    return {
      approved: violations.length === 0,
      confidence: maxConfidence,
      action:
        maxConfidence > 85 ? "reject" : maxConfidence > 60 ? "flag" : "approve",
      violations,
    };
  }

  /**
   * Check for duplicate listings from the same seller
   *
   * Uses text similarity to detect duplicates with ≥95% similarity threshold.
   *
   * Requirement 6.3: Identify duplicate listings (≥95% similarity)
   *
   * @param listingId - Current listing ID
   * @param userId - Seller user ID
   * @param title - Listing title
   * @param description - Listing description
   * @returns Duplicate check result
   */
  private async checkDuplicates(
    listingId: string,
    userId: string,
    title: string,
    description: string,
  ): Promise<{
    isDuplicate: boolean;
    duplicateListingId?: string;
    similarity?: number;
  }> {
    try {
      const supabase = await createClient();

      // Fetch other active listings from the same seller
      const { data: otherListings, error } = await (supabase as any)
        .from("listings")
        .select("id, title, description")
        .eq("user_id", userId)
        .eq("status", "active")
        .neq("id", listingId)
        .limit(50); // Limit to recent listings for performance

      if (error || !otherListings || otherListings.length === 0) {
        return { isDuplicate: false };
      }

      // Calculate similarity with each listing
      const currentText = `${title} ${description}`.toLowerCase();

      for (const other of otherListings) {
        const otherText = `${other.title} ${other.description}`.toLowerCase();
        const similarity = this.calculateTextSimilarity(currentText, otherText);

        // Requirement 6.3: Flag duplicates with ≥95% similarity
        if (similarity >= 95) {
          return {
            isDuplicate: true,
            duplicateListingId: other.id,
            similarity,
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return { isDuplicate: false };
    }
  }

  /**
   * Calculate text similarity between two strings
   *
   * Uses Jaccard similarity coefficient on word sets.
   * Returns similarity percentage (0-100).
   *
   * @param text1 - First text
   * @param text2 - Second text
   * @returns Similarity percentage (0-100)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Tokenize into words
    const words1 = new Set(
      text1
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .map((w) => w.replace(/[^\w]/g, "")),
    );
    const words2 = new Set(
      text2
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .map((w) => w.replace(/[^\w]/g, "")),
    );

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    const similarity = (intersection.size / union.size) * 100;
    return Math.round(similarity);
  }

  /**
   * Determine moderation action based on confidence score
   *
   * Requirement 6.5: Flag for manual review (60-85% confidence)
   * Requirement 6.6: Auto-reject (>85% confidence)
   *
   * @param confidence - Confidence score (0-100)
   * @param hasViolations - Whether violations were detected
   * @returns Moderation action
   */
  private determineAction(
    confidence: number,
    hasViolations: boolean,
  ): ModerationAction {
    if (!hasViolations || confidence < 60) {
      return "approve";
    } else if (confidence > 85) {
      // Requirement 6.6: Auto-reject with >85% confidence
      return "reject";
    } else {
      // Requirement 6.5: Flag for manual review (60-85% confidence)
      return "flag";
    }
  }

  /**
   * Store moderation result in database
   *
   * Saves the moderation result for audit trail and admin review.
   *
   * @param result - Moderation result to store
   * @param userId - User ID who created the listing
   * @param listingId - Optional listing ID
   * @returns Stored moderation result ID
   */
  async storeModerationResult(
    result: ComprehensiveModerationResult,
    userId: string,
    listingId?: string,
  ): Promise<string | null> {
    try {
      const supabase = await createClient();

      const moderationData = {
        listing_id: listingId || null,
        user_id: userId,
        approved: result.approved,
        confidence_score: result.confidence,
        action: result.action,
        violations: result.violations as any,
        scanned_content: result.scannedContent as any,
        scan_type: "comprehensive" as const,
      };

      const { data, error } = await supabase
        .from("moderation_results")
        .insert(moderationData)
        .select("id")
        .single();

      if (error) {
        console.error("Error storing moderation result:", error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error("Error storing moderation result:", error);
      return null;
    }
  }

  /**
   * Prevent listing publication if prohibited content detected
   *
   * Requirement 6.4: Prevent listing publication if prohibited content detected
   *
   * @param result - Moderation result
   * @returns Whether listing should be blocked
   */
  shouldBlockListing(result: ComprehensiveModerationResult): boolean {
    return result.action === "reject";
  }

  /**
   * Get human-readable rejection reason
   *
   * @param result - Moderation result
   * @returns Rejection reason message
   */
  getRejectionReason(result: ComprehensiveModerationResult): string {
    if (result.violations.length === 0) {
      return "Your listing has been rejected due to policy violations.";
    }

    const highSeverityViolations = result.violations.filter(
      (v) => v.severity === "high",
    );

    if (highSeverityViolations.length > 0) {
      return `Your listing has been rejected: ${highSeverityViolations.map((v) => v.details).join("; ")}`;
    }

    return `Your listing has been rejected: ${result.violations[0].details}`;
  }

  /**
   * Get flagging reason for manual review
   *
   * @param result - Moderation result
   * @returns Flagging reason message
   */
  getFlaggingReason(result: ComprehensiveModerationResult): string {
    if (result.violations.length === 0) {
      return "Your listing has been flagged for manual review.";
    }

    return `Your listing has been flagged for review: ${result.violations.map((v) => v.details).join("; ")}`;
  }

  /**
   * Calculate similarity between two listings
   * Public method for testing and external use
   */
  async calculateSimilarity(
    listing1: { title: string; description: string; price?: number },
    listing2: { title: string; description: string; price?: number },
  ): Promise<number> {
    const text1 = `${listing1.title} ${listing1.description}`.toLowerCase();
    const text2 = `${listing2.title} ${listing2.description}`.toLowerCase();
    return this.calculateTextSimilarity(text1, text2) / 100; // Return 0-1 scale
  }

  /**
   * Check for duplicate listings from a specific user
   */
  async checkUserDuplicates(
    userId: string,
    listing: { title: string; description: string },
  ): Promise<{
    hasDuplicates: boolean;
    duplicateListings: Array<{ id: string; similarity: number }>;
    action: string;
  }> {
    try {
      const supabase = await createClient();

      const { data: otherListings, error } = await (supabase as any)
        .from("listings")
        .select("id, title, description")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(50);

      if (error || !otherListings || otherListings.length === 0) {
        return {
          hasDuplicates: false,
          duplicateListings: [],
          action: "approve",
        };
      }

      const currentText =
        `${listing.title} ${listing.description}`.toLowerCase();
      const duplicates: Array<{ id: string; similarity: number }> = [];

      for (const other of otherListings) {
        const otherText = `${other.title} ${other.description}`.toLowerCase();
        const similarity = this.calculateTextSimilarity(currentText, otherText);

        if (similarity >= 95) {
          duplicates.push({ id: other.id, similarity });
        }
      }

      return {
        hasDuplicates: duplicates.length > 0,
        duplicateListings: duplicates,
        action: duplicates.length > 0 ? "flag" : "approve",
      };
    } catch (error) {
      console.error("Error checking user duplicates:", error);
      return { hasDuplicates: false, duplicateListings: [], action: "approve" };
    }
  }

  /**
   * Scan a single image for inappropriate content
   */
  async scanImage(imageUrl: string): Promise<{
    safe: boolean;
    categories: string[];
    confidence: number;
  }> {
    const result = await this.scanImages([imageUrl]);
    return {
      safe: result.approved,
      categories: result.violations.map((v) => v.type),
      confidence: result.confidence,
    };
  }

  /**
   * Detect prohibited keywords in text
   */
  async detectProhibitedKeywords(text: string): Promise<{
    hasProhibitedContent: boolean;
    keywords: string[];
  }> {
    const prohibitedKeywords = [
      "drugs",
      "weapons",
      "counterfeit",
      "stolen",
      "fake",
      "replica",
    ];

    const lowerText = text.toLowerCase();
    const foundKeywords = prohibitedKeywords.filter((keyword) =>
      lowerText.includes(keyword),
    );

    return {
      hasProhibitedContent: foundKeywords.length > 0,
      keywords: foundKeywords,
    };
  }

  /**
   * Detect scam patterns in text
   */
  async detectScamPatterns(text: string): Promise<{
    isScam: boolean;
    patterns: string[];
  }> {
    const scamPatterns = [
      "send money first",
      "pay before",
      "whatsapp only",
      "contact me on whatsapp",
      "100% guaranteed",
      "no refunds",
    ];

    const lowerText = text.toLowerCase();
    const foundPatterns = scamPatterns.filter((pattern) =>
      lowerText.includes(pattern),
    );

    return {
      isScam: foundPatterns.length > 0,
      patterns: foundPatterns,
    };
  }

  /**
   * Get user moderation history
   */
  async getUserModerationHistory(userId: string): Promise<{
    totalViolations: number;
    recentViolations: number;
    riskScore: number;
  }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("moderation_results")
        .select("*")
        .eq("user_id", userId)
        .eq("approved", false)
        .order("created_at", { ascending: false });

      if (error || !data) {
        return { totalViolations: 0, recentViolations: 0, riskScore: 0 };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentViolations = data.filter(
        (r) => new Date(r.created_at) > thirtyDaysAgo,
      ).length;

      const riskScore = Math.min(
        (recentViolations * 0.2 + data.length * 0.1) / 2,
        1,
      );

      return {
        totalViolations: data.length,
        recentViolations,
        riskScore,
      };
    } catch (error) {
      console.error("Error getting user moderation history:", error);
      return { totalViolations: 0, recentViolations: 0, riskScore: 0 };
    }
  }

  /**
   * Calculate user risk score
   */
  async calculateUserRiskScore(userId: string): Promise<number> {
    const history = await this.getUserModerationHistory(userId);
    return history.riskScore;
  }

  /**
   * Analyze listing patterns for suspicious behavior
   */
  async analyzeListingPattern(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    try {
      const supabase = await createClient();

      const { data: listings, error } = await (supabase as any)
        .from("listings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error || !listings || listings.length === 0) {
        return { suspicious: false, reasons: [] };
      }

      const reasons: string[] = [];

      // Check for rapid listing creation
      if (listings.length >= 10) {
        const firstListing = new Date(listings[listings.length - 1].created_at);
        const lastListing = new Date(listings[0].created_at);
        const daysDiff =
          (lastListing.getTime() - firstListing.getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysDiff < 1) {
          reasons.push("Rapid listing creation (10+ listings in 24 hours)");
        }
      }

      return {
        suspicious: reasons.length > 0,
        reasons,
      };
    } catch (error) {
      console.error("Error analyzing listing pattern:", error);
      return { suspicious: false, reasons: [] };
    }
  }

  /**
   * Add content to review queue
   */
  async addToReviewQueue(
    listing: { id: string; title: string; description: string },
    options: { reason: string; confidence: number },
  ): Promise<void> {
    try {
      const supabase = await createClient();

      await (supabase as any).from("moderation_queue").insert({
        listing_id: listing.id,
        reason: options.reason,
        confidence: options.confidence,
        status: "pending",
      });
    } catch (error) {
      console.error("Error adding to review queue:", error);
    }
  }

  /**
   * Get review queue
   */
  async getReviewQueue(): Promise<
    Array<{ listingId: string; confidence: number; reason: string }>
  > {
    try {
      const supabase = await createClient();

      const { data, error } = await (supabase as any)
        .from("moderation_queue")
        .select("*")
        .eq("status", "pending")
        .order("confidence", { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((item: any) => ({
        listingId: item.listing_id,
        confidence: item.confidence,
        reason: item.reason,
      }));
    } catch (error) {
      console.error("Error getting review queue:", error);
      return [];
    }
  }

  /**
   * Approve flagged content
   */
  async approveContent(
    listingId: string,
    adminId: string,
    reason: string,
  ): Promise<{ status: string; reviewedBy: string }> {
    try {
      const supabase = await createClient();

      await (supabase as any)
        .from("moderation_queue")
        .update({
          status: "approved",
          reviewed_by: adminId,
          review_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("listing_id", listingId);

      return { status: "approved", reviewedBy: adminId };
    } catch (error) {
      console.error("Error approving content:", error);
      throw error;
    }
  }

  /**
   * Reject flagged content
   */
  async rejectContent(
    listingId: string,
    adminId: string,
    reason: string,
  ): Promise<{ status: string; reviewedBy: string }> {
    try {
      const supabase = await createClient();

      await (supabase as any)
        .from("moderation_queue")
        .update({
          status: "rejected",
          reviewed_by: adminId,
          review_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("listing_id", listingId);

      return { status: "rejected", reviewedBy: adminId };
    } catch (error) {
      console.error("Error rejecting content:", error);
      throw error;
    }
  }

  /**
   * Scan multiple listings in batch
   */
  async scanListingsBatch(
    listings: Array<ListingForModeration>,
  ): Promise<ComprehensiveModerationResult[]> {
    const results: ComprehensiveModerationResult[] = [];

    for (const listing of listings) {
      try {
        const result = await this.scanListing(listing);
        results.push(result);
      } catch (error) {
        console.error("Error scanning listing:", error);
        // Continue with other listings
      }
    }

    return results;
  }
}

/**
 * Create a singleton instance of ContentModerationService
 */
export const contentModerationService = new ContentModerationService();
