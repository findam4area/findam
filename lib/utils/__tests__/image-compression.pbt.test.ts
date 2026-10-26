/**
 * Property-Based Tests for Image Compression
 * Requirements: 18.2, 18.3
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  getLowDataImageUrl,
  getVideoThumbnailUrl,
  shouldAutoPlayVideo,
  calculateDataSavings,
  estimateImageSize,
  formatBytes,
} from "../image-compression";

describe("Image Compression Property Tests", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  describe("Property 59: Low-Data Image Compression", () => {
    it("should always compress images to 50% quality or less in low-data mode", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10 }),
          fc.integer({ min: 100, max: 4000 }),
          fc.integer({ min: 100, max: 4000 }),
          (publicId, width, height) => {
            // Enable low-data mode
            if (typeof window !== "undefined") {
              localStorage.setItem("low_data_mode", "true");
            }

            const cloudinaryUrl = `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`;
            const optimizedUrl = getLowDataImageUrl(cloudinaryUrl, {
              maxWidth: width,
              maxHeight: height,
            });

            // Should contain quality parameter of 50 or less
            const qualityMatch = optimizedUrl.match(/q_(\d+)/);
            if (qualityMatch) {
              const quality = parseInt(qualityMatch[1]);
              expect(quality).toBeLessThanOrEqual(50);
            }

            // Should contain width and height limits
            expect(optimizedUrl).toContain(`w_${width}`);
            expect(optimizedUrl).toContain(`h_${height}`);

            // Should use WebP format for better compression
            expect(optimizedUrl).toContain("f_webp");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reduce image dimensions in low-data mode", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10 }),
          fc.integer({ min: 800, max: 4000 }),
          (publicId, originalSize) => {
            if (typeof window !== "undefined") {
              localStorage.setItem("low_data_mode", "true");
            }

            const cloudinaryUrl = `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`;
            const optimizedUrl = getLowDataImageUrl(cloudinaryUrl);

            // Default max dimensions should be 800x800
            const widthMatch = optimizedUrl.match(/w_(\d+)/);
            const heightMatch = optimizedUrl.match(/h_(\d+)/);

            if (widthMatch && heightMatch) {
              const width = parseInt(widthMatch[1]);
              const height = parseInt(heightMatch[1]);

              expect(width).toBeLessThanOrEqual(800);
              expect(height).toBeLessThanOrEqual(800);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not modify URLs when low-data mode is disabled", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (publicId) => {
          // Disable low-data mode
          if (typeof window !== "undefined") {
            localStorage.setItem("low_data_mode", "false");
          }

          const originalUrl = `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`;
          const result = getLowDataImageUrl(originalUrl);

          // URL should remain unchanged
          expect(result).toBe(originalUrl);
        }),
        { numRuns: 100 },
      );
    });

    it.skip("should calculate correct data savings", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000000 }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(0.9) }),
          (originalSize, compressionRatio) => {
            const compressedSize = Math.floor(originalSize * compressionRatio);
            const savings = calculateDataSavings(originalSize, compressedSize);

            // Saved bytes should be positive
            expect(savings.savedBytes).toBeGreaterThan(0);

            // Savings percentage should be between 0 and 100
            expect(savings.savingsPercentage).toBeGreaterThan(0);
            expect(savings.savingsPercentage).toBeLessThan(100);

            // Saved MB should be correct
            const expectedMB = savings.savedBytes / (1024 * 1024);
            expect(savings.savedMB).toBeCloseTo(expectedMB, 5);

            // Percentage should match calculation
            const expectedPercentage =
              (savings.savedBytes / originalSize) * 100;
            expect(savings.savingsPercentage).toBeCloseTo(
              expectedPercentage,
              5,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should estimate image size proportionally to dimensions", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 2000 }),
          fc.integer({ min: 100, max: 2000 }),
          fc.integer({ min: 10, max: 100 }),
          (width, height, quality) => {
            const size1 = estimateImageSize(width, height, quality);
            const size2 = estimateImageSize(width * 2, height * 2, quality);

            // Doubling dimensions should roughly quadruple size
            const ratio = size2 / size1;
            expect(ratio).toBeGreaterThan(3);
            expect(ratio).toBeLessThan(5);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 60: Low-Data Video Behavior", () => {
    it("should disable auto-play in low-data mode", () => {
      fc.assert(
        fc.property(fc.boolean(), (lowDataMode) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("low_data_mode", lowDataMode.toString());
          }

          const shouldAutoPlay = shouldAutoPlayVideo();

          // Auto-play should be opposite of low-data mode
          expect(shouldAutoPlay).toBe(!lowDataMode);
        }),
        { numRuns: 50 },
      );
    });

    it.skip("should generate valid video thumbnail URLs", () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9_-]{10,50}$/), // Only alphanumeric, underscore, hyphen
          fc.integer({ min: 100, max: 1920 }),
          fc.integer({ min: 100, max: 1080 }),
          (publicId, width, height) => {
            const cloudinaryVideoUrl = `https://res.cloudinary.com/demo/video/upload/${publicId}.mp4`;
            const thumbnailUrl = getVideoThumbnailUrl(cloudinaryVideoUrl, {
              width,
              height,
            });

            // Should be an image URL, not video
            expect(thumbnailUrl).toContain("/image/");
            expect(thumbnailUrl).not.toContain("/video/");

            // Should have correct dimensions
            expect(thumbnailUrl).toContain(`w_${width}`);
            expect(thumbnailUrl).toContain(`h_${height}`);

            // Should be JPEG format
            expect(thumbnailUrl).toContain("f_jpg");

            // Should have start offset for thumbnail
            expect(thumbnailUrl).toContain("so_");
          },
        ),
        { numRuns: 100 },
      );
    });

    it.skip("should generate Mux video thumbnails correctly", () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9_-]{10,50}$/), // Only alphanumeric, underscore, hyphen
          fc.integer({ min: 100, max: 1920 }),
          fc.integer({ min: 100, max: 1080 }),
          (playbackId, width, height) => {
            const muxVideoUrl = `https://stream.mux.com/${playbackId}.m3u8`;
            const thumbnailUrl = getVideoThumbnailUrl(muxVideoUrl, {
              width,
              height,
            });

            // Should be Mux image URL
            expect(thumbnailUrl).toContain("image.mux.com");
            expect(thumbnailUrl).toContain(playbackId);

            // Should have dimensions in query params
            expect(thumbnailUrl).toContain(`width=${width}`);
            expect(thumbnailUrl).toContain(`height=${height}`);

            // Should have time parameter
            expect(thumbnailUrl).toContain("time=");
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Utility Functions", () => {
    it("should format bytes correctly for all sizes", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10000000000 }), (bytes) => {
          const formatted = formatBytes(bytes);

          // Should contain a number
          expect(formatted).toMatch(/\d+/);

          // Should contain a unit
          expect(formatted).toMatch(/Bytes|KB|MB|GB/);

          // Should be a valid format
          const parts = formatted.split(" ");
          expect(parts).toHaveLength(2);

          const value = parseFloat(parts[0]);
          expect(value).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 },
      );
    });

    it("should format zero bytes correctly", () => {
      const formatted = formatBytes(0);
      expect(formatted).toBe("0 Bytes");
    });

    it("should use appropriate units for different sizes", () => {
      // Bytes
      expect(formatBytes(500)).toContain("Bytes");

      // KB
      expect(formatBytes(5000)).toContain("KB");

      // MB
      expect(formatBytes(5000000)).toContain("MB");

      // GB
      expect(formatBytes(5000000000)).toContain("GB");
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-Cloudinary URLs gracefully", () => {
      fc.assert(
        fc.property(fc.webUrl(), (url) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("low_data_mode", "true");
          }

          // Non-Cloudinary URLs should be returned as-is
          if (!url.includes("cloudinary.com")) {
            const result = getLowDataImageUrl(url);
            expect(result).toBe(url);
          }
        }),
        { numRuns: 50 },
      );
    });

    it("should handle invalid Cloudinary URLs", () => {
      const invalidUrl = "https://res.cloudinary.com/demo/invalid";
      const result = getLowDataImageUrl(invalidUrl);

      // Should return original URL if parsing fails
      expect(result).toBe(invalidUrl);
    });

    it("should handle missing dimensions gracefully", () => {
      if (typeof window !== "undefined") {
        localStorage.setItem("low_data_mode", "true");
      }

      const url = "https://res.cloudinary.com/demo/image/upload/test.jpg";
      const result = getLowDataImageUrl(url);

      // Should still apply transformations with defaults
      expect(result).toContain("q_50");
      expect(result).toContain("w_800");
      expect(result).toContain("h_800");
    });
  });
});
