/**
 * Unit tests for ContentModerationService
 *
 * Tests core moderation functionality including:
 * - Text content scanning
 * - Scam indicator detection
 * - Price anomaly detection
 * - Duplicate detection
 * - Confidence-based actions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContentModerationService } from "../content-moderation";
import type { ListingForModeration } from "../content-moderation";

// Mock the OpenAI moderation service
vi.mock("../openai-moderation", () => ({
  scanTextContent: vi.fn(),
  scanMultipleFields: vi.fn(),
  detectScamIndicators: vi.fn(),
  detectPriceAnomaly: vi.fn(),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: "test-id" },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe("ContentModerationService", () => {
  let service: ContentModerationService;

  beforeEach(() => {
    service = new ContentModerationService();
    vi.clearAllMocks();
  });

  describe("scanListing", () => {
    it("should approve clean listings with no violations", async () => {
      const { scanMultipleFields, detectScamIndicators, detectPriceAnomaly } =
        await import("../openai-moderation");

      vi.mocked(scanMultipleFields).mockResolvedValue({
        approved: true,
        confidence: 10,
        action: "approve",
        violations: [],
      });

      vi.mocked(detectScamIndicators).mockReturnValue({
        hasScamIndicators: false,
        indicators: [],
        confidence: 0,
      });

      vi.mocked(detectPriceAnomaly).mockReturnValue({
        isAnomalous: false,
        reason: "Price appears normal",
        confidence: 0,
      });

      const listing: ListingForModeration = {
        title: "iPhone 13 Pro",
        description: "Excellent condition, barely used",
        price: 450000,
        category: "phones",
        userId: "user-123",
      };

      const result = await service.scanListing(listing);

      expect(result.approved).toBe(true);
      expect(result.action).toBe("approve");
      expect(result.violations).toHaveLength(0);
    });

    it("should detect and flag scam indicators", async () => {
      const { scanMultipleFields, detectScamIndicators, detectPriceAnomaly } =
        await import("../openai-moderation");

      vi.mocked(scanMultipleFields).mockResolvedValue({
        approved: true,
        confidence: 10,
        action: "approve",
        violations: [],
      });

      vi.mocked(detectScamIndicators).mockReturnValue({
        hasScamIndicators: true,
        indicators: ["Requests payment before delivery"],
        confidence: 70,
      });

      vi.mocked(detectPriceAnomaly).mockReturnValue({
        isAnomalous: false,
        reason: "Price appears normal",
        confidence: 0,
      });

      const listing: ListingForModeration = {
        title: "iPhone 13 Pro",
        description: "Pay before delivery. Send money first.",
        price: 450000,
        category: "phones",
        userId: "user-123",
      };

      const result = await service.scanListing(listing);

      expect(result.approved).toBe(false);
      expect(result.action).toBe("flag");
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].type).toBe("scam_indicators");
    });

    it("should auto-reject listings with high confidence violations", async () => {
      const { scanMultipleFields, detectScamIndicators, detectPriceAnomaly } =
        await import("../openai-moderation");

      vi.mocked(scanMultipleFields).mockResolvedValue({
        approved: false,
        confidence: 90,
        action: "reject",
        violations: [
          {
            type: "sexual",
            severity: "high",
            details: "Content is sexually explicit",
            confidence: 90,
          },
        ],
      });

      vi.mocked(detectScamIndicators).mockReturnValue({
        hasScamIndicators: false,
        indicators: [],
        confidence: 0,
      });

      vi.mocked(detectPriceAnomaly).mockReturnValue({
        isAnomalous: false,
        reason: "Price appears normal",
        confidence: 0,
      });

      const listing: ListingForModeration = {
        title: "Inappropriate content",
        description: "Explicit content here",
        price: 1000,
        category: "other",
        userId: "user-123",
      };

      const result = await service.scanListing(listing);

      expect(result.approved).toBe(false);
      expect(result.action).toBe("reject");
      expect(result.confidence).toBeGreaterThan(85);
    });

    it("should detect price anomalies", async () => {
      const { scanMultipleFields, detectScamIndicators, detectPriceAnomaly } =
        await import("../openai-moderation");

      vi.mocked(scanMultipleFields).mockResolvedValue({
        approved: true,
        confidence: 10,
        action: "approve",
        violations: [],
      });

      vi.mocked(detectScamIndicators).mockReturnValue({
        hasScamIndicators: false,
        indicators: [],
        confidence: 0,
      });

      vi.mocked(detectPriceAnomaly).mockReturnValue({
        isAnomalous: true,
        reason: "Price is suspiciously low (< ₦100)",
        confidence: 80,
      });

      const listing: ListingForModeration = {
        title: "iPhone 13 Pro",
        description: "Brand new",
        price: 50,
        category: "phones",
        userId: "user-123",
      };

      const result = await service.scanListing(listing);

      expect(result.approved).toBe(false);
      expect(result.action).toBe("flag");
      expect(result.violations.some((v) => v.type === "price_anomaly")).toBe(
        true,
      );
    });
  });

  describe("shouldBlockListing", () => {
    it("should block listings with reject action", () => {
      const result = {
        approved: false,
        confidence: 90,
        action: "reject" as const,
        violations: [],
        scannedContent: {
          title: "Test",
          description: "Test",
        },
      };

      expect(service.shouldBlockListing(result)).toBe(true);
    });

    it("should not block listings with approve action", () => {
      const result = {
        approved: true,
        confidence: 10,
        action: "approve" as const,
        violations: [],
        scannedContent: {
          title: "Test",
          description: "Test",
        },
      };

      expect(service.shouldBlockListing(result)).toBe(false);
    });

    it("should not block listings with flag action", () => {
      const result = {
        approved: false,
        confidence: 70,
        action: "flag" as const,
        violations: [],
        scannedContent: {
          title: "Test",
          description: "Test",
        },
      };

      expect(service.shouldBlockListing(result)).toBe(false);
    });
  });

  describe("getRejectionReason", () => {
    it("should return generic message when no violations", () => {
      const result = {
        approved: false,
        confidence: 90,
        action: "reject" as const,
        violations: [],
        scannedContent: {
          title: "Test",
          description: "Test",
        },
      };

      const reason = service.getRejectionReason(result);
      expect(reason).toContain("policy violations");
    });

    it("should return specific reason for high severity violations", () => {
      const result = {
        approved: false,
        confidence: 90,
        action: "reject" as const,
        violations: [
          {
            type: "prohibited_item",
            severity: "high" as const,
            details: "Weapons detected",
            confidence: 90,
          },
        ],
        scannedContent: {
          title: "Test",
          description: "Test",
        },
      };

      const reason = service.getRejectionReason(result);
      expect(reason).toContain("Weapons detected");
    });
  });

  describe("getFlaggingReason", () => {
    it("should return generic message when no violations", () => {
      const result = {
        approved: false,
        confidence: 70,
        action: "flag" as const,
        violations: [],
        scannedContent: {
          title: "Test",
          description: "Test",
        },
      };

      const reason = service.getFlaggingReason(result);
      expect(reason).toContain("flagged for manual review");
    });

    it("should return specific reasons for violations", () => {
      const result = {
        approved: false,
        confidence: 70,
        action: "flag" as const,
        violations: [
          {
            type: "scam_indicators",
            severity: "medium" as const,
            details: "Suspicious language detected",
            confidence: 70,
          },
        ],
        scannedContent: {
          title: "Test",
          description: "Test",
        },
      };

      const reason = service.getFlaggingReason(result);
      expect(reason).toContain("Suspicious language detected");
    });
  });
});
