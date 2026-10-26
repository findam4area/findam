/**
 * Tests for OpenAI Moderation Service
 *
 * Note: These tests require OPENAI_API_KEY to be set in environment.
 * Some tests are skipped by default to avoid API calls during CI/CD.
 */

import { describe, it, expect } from "vitest";
import { detectScamIndicators, detectPriceAnomaly } from "../openai-moderation";

describe("OpenAI Moderation Service", () => {
  describe("detectScamIndicators", () => {
    it('should detect "pay before delivery" scam pattern', () => {
      const text = "Great phone! Pay before delivery for discount.";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
      expect(result.indicators).toContain("Requests payment before delivery");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect "send money first" scam pattern', () => {
      const text = "Send money first, then I will ship the item.";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
      expect(result.indicators).toContain("Requests money transfer first");
    });

    it("should detect wire transfer services mention", () => {
      const text = "Payment via Western Union only.";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
      expect(result.indicators).toContain("Mentions wire transfer services");
    });

    it("should detect guaranteed profit schemes", () => {
      const text = "Invest now for guaranteed profit of 500%!";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
      expect(result.indicators).toContain("Promises guaranteed profits");
    });

    it("should detect false urgency tactics", () => {
      const text = "Urgent sale! Must sell today!";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
      expect(result.indicators).toContain("Creates false urgency");
    });

    it("should detect off-platform communication attempts", () => {
      const text = "Contact me on WhatsApp only: 08012345678";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
      expect(result.indicators).toContain("Avoids platform communication");
    });

    it("should detect cryptocurrency investment schemes", () => {
      const text = "Bitcoin investment opportunity with high returns!";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
      expect(result.indicators).toContain("Cryptocurrency investment scheme");
    });

    it("should not flag legitimate listings", () => {
      const text =
        "Brand new iPhone 13 Pro Max. Excellent condition. Serious buyers only.";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(false);
      expect(result.indicators).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it("should calculate confidence based on number of indicators", () => {
      const text = "Pay before delivery! Send money first via Western Union!";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
      expect(result.indicators.length).toBeGreaterThan(1);
      expect(result.confidence).toBeGreaterThan(25);
    });

    it("should be case-insensitive", () => {
      const text = "PAY BEFORE DELIVERY";
      const result = detectScamIndicators(text);

      expect(result.hasScamIndicators).toBe(true);
    });
  });

  describe("detectPriceAnomaly", () => {
    it("should flag suspiciously low prices", () => {
      const result = detectPriceAnomaly(50, "Electronics");

      expect(result.isAnomalous).toBe(true);
      expect(result.reason).toContain("suspiciously low");
      expect(result.confidence).toBe(80);
    });

    it("should flag prices far below category average", () => {
      const result = detectPriceAnomaly(5000, "Phones", 50000);

      expect(result.isAnomalous).toBe(true);
      expect(result.reason).toContain("below category average");
      expect(result.confidence).toBeGreaterThan(80);
    });

    it("should not flag reasonable prices", () => {
      const result = detectPriceAnomaly(45000, "Phones", 50000);

      expect(result.isAnomalous).toBe(false);
      expect(result.reason).toContain("normal");
      expect(result.confidence).toBe(0);
    });

    it("should not flag prices without category average", () => {
      const result = detectPriceAnomaly(5000, "Electronics");

      expect(result.isAnomalous).toBe(false);
    });

    it("should calculate percentage difference correctly", () => {
      const result = detectPriceAnomaly(10000, "Phones", 100000);

      expect(result.isAnomalous).toBe(true);
      expect(result.reason).toContain("90%");
    });
  });

  // These tests are skipped by default to avoid API calls
  // Uncomment and run manually when testing OpenAI integration
  describe.skip("OpenAI API Integration", () => {
    it("should scan clean text content", async () => {
      const { scanTextContent } = await import("../openai-moderation");

      const result = await scanTextContent(
        "This is a normal product description.",
      );

      expect(result).toHaveProperty("approved");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("action");
      expect(result).toHaveProperty("violations");
    });

    it("should detect inappropriate content", async () => {
      const { scanTextContent } = await import("../openai-moderation");

      const result = await scanTextContent(
        "Extremely offensive and hateful content here",
      );

      expect(result.approved).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("should scan multiple fields", async () => {
      const { scanMultipleFields } = await import("../openai-moderation");

      const result = await scanMultipleFields({
        title: "Product Title",
        description: "Product description",
      });

      expect(result).toHaveProperty("approved");
      expect(result).toHaveProperty("confidence");
    });

    it("should check API health", async () => {
      const { checkOpenAIHealth } = await import("../openai-moderation");

      const isHealthy = await checkOpenAIHealth();

      expect(typeof isHealthy).toBe("boolean");
    });
  });
});
