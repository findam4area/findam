import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generateSlug, truncateText } from "./utils";

describe("Utils - Property-Based Tests", () => {
  describe("generateSlug", () => {
    it("should always return lowercase strings", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const slug = generateSlug(text);
          expect(slug).toBe(slug.toLowerCase());
        }),
        { numRuns: 20 },
      );
    });

    it("should not contain spaces", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const slug = generateSlug(text);
          expect(slug).not.toContain(" ");
        }),
        { numRuns: 20 },
      );
    });
  });

  describe("truncateText", () => {
    it("should never exceed max length", () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer({ min: 1, max: 100 }),
          (text, maxLength) => {
            const truncated = truncateText(text, maxLength);
            expect(truncated.length).toBeLessThanOrEqual(maxLength + 3); // +3 for '...'
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should preserve short strings", () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 10 }),
          fc.integer({ min: 20, max: 100 }),
          (text, maxLength) => {
            const truncated = truncateText(text, maxLength);
            expect(truncated).toBe(text);
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
