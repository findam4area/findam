import { describe, it, expect } from "vitest";
import {
  cn,
  formatPrice,
  formatDate,
  generateSlug,
  truncateText,
} from "../utils";

describe("Utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
      expect(cn("px-4", "px-8")).toBe("px-8");
    });
  });

  describe("formatPrice", () => {
    it("should format Nigerian Naira correctly", () => {
      expect(formatPrice(1000)).toContain("1,000");
      expect(formatPrice(500)).toContain("500");
    });
  });

  describe("formatDate", () => {
    it("should format dates correctly", () => {
      const date = new Date("2024-01-15");
      const formatted = formatDate(date);
      expect(formatted).toContain("January");
      expect(formatted).toContain("15");
      expect(formatted).toContain("2024");
    });
  });

  describe("generateSlug", () => {
    it("should generate valid slugs", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
      expect(generateSlug("Test  Multiple   Spaces")).toBe(
        "test-multiple-spaces",
      );
      expect(generateSlug("Special!@#Characters")).toBe("specialcharacters");
    });
  });

  describe("truncateText", () => {
    it("should truncate long text", () => {
      expect(truncateText("Hello World", 5)).toBe("Hello...");
      expect(truncateText("Short", 10)).toBe("Short");
    });
  });
});
