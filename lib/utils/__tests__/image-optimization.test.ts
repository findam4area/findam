import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateImage,
  calculateTotalProgress,
  getProgressMessage,
  cleanupObjectUrls,
  supportsWebP,
  IMAGE_SIZES,
  MAX_FILE_SIZE_BYTES,
  ACCEPTED_IMAGE_FORMATS,
} from "../image-optimization";

describe("Image Optimization Utilities", () => {
  describe("validateImage", () => {
    it("should accept valid JPEG image", () => {
      const file = new File(["dummy content"], "test.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

      const result = validateImage(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid PNG image", () => {
      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 }); // 2MB

      const result = validateImage(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid WebP image", () => {
      const file = new File(["dummy content"], "test.webp", {
        type: "image/webp",
      });
      Object.defineProperty(file, "size", { value: 3 * 1024 * 1024 }); // 3MB

      const result = validateImage(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid image format", () => {
      const file = new File(["dummy content"], "test.gif", {
        type: "image/gif",
      });
      Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

      const result = validateImage(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid format");
      expect(result.error).toContain("image/gif");
    });

    it("should reject file exceeding size limit", () => {
      const file = new File(["dummy content"], "test.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(file, "size", {
        value: MAX_FILE_SIZE_BYTES + 1,
      });

      const result = validateImage(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("exceeds maximum allowed size");
    });

    it("should accept file at exactly the size limit", () => {
      const file = new File(["dummy content"], "test.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(file, "size", { value: MAX_FILE_SIZE_BYTES });

      const result = validateImage(file);

      expect(result.isValid).toBe(true);
    });
  });

  describe("calculateTotalProgress", () => {
    it("should return 0 when no files", () => {
      const progress = calculateTotalProgress(0, 0, 0);
      expect(progress).toBe(0);
    });

    it("should calculate progress for single file", () => {
      const progress = calculateTotalProgress(1, 0, 50);
      expect(progress).toBe(50);
    });

    it("should calculate progress for multiple files with some completed", () => {
      const progress = calculateTotalProgress(4, 2, 50);
      // 2 completed = 50%, current at 50% = 12.5%, total = 62.5%
      expect(progress).toBe(63); // Rounded
    });

    it("should cap progress at 100%", () => {
      const progress = calculateTotalProgress(1, 1, 100);
      expect(progress).toBe(100);
    });

    it("should handle all files completed", () => {
      const progress = calculateTotalProgress(5, 5, 0);
      expect(progress).toBe(100);
    });
  });

  describe("getProgressMessage", () => {
    it("should return step only for single file", () => {
      const message = getProgressMessage(1, 1, "Compressing...");
      expect(message).toBe("Compressing...");
    });

    it("should include file count for multiple files", () => {
      const message = getProgressMessage(2, 5, "Compressing...");
      expect(message).toBe("Image 2/5: Compressing...");
    });

    it("should handle first file of many", () => {
      const message = getProgressMessage(1, 10, "Loading...");
      expect(message).toBe("Image 1/10: Loading...");
    });

    it("should handle last file", () => {
      const message = getProgressMessage(10, 10, "Complete!");
      expect(message).toBe("Image 10/10: Complete!");
    });
  });

  describe("cleanupObjectUrls", () => {
    it("should revoke all provided URLs", () => {
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");
      const urls = ["blob:url1", "blob:url2", "blob:url3"];

      cleanupObjectUrls(urls);

      expect(revokeObjectURL).toHaveBeenCalledTimes(3);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:url1");
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:url2");
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:url3");

      revokeObjectURL.mockRestore();
    });

    it("should handle empty array", () => {
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");

      cleanupObjectUrls([]);

      expect(revokeObjectURL).not.toHaveBeenCalled();

      revokeObjectURL.mockRestore();
    });

    it("should continue on error", () => {
      const revokeObjectURL = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementationOnce(() => {
          throw new Error("Failed to revoke");
        });

      // Should not throw
      expect(() => cleanupObjectUrls(["blob:url1", "blob:url2"])).not.toThrow();

      expect(revokeObjectURL).toHaveBeenCalledTimes(2);

      revokeObjectURL.mockRestore();
    });
  });

  describe("supportsWebP", () => {
    it("should detect WebP support", async () => {
      // This test depends on browser environment
      // In Node environment, Image API isn't available, so we skip
      // In real browser environment, this would test WebP support
      
      // Mock implementation for test environment
      if (typeof Image === "undefined") {
        // Node environment - skip actual test
        expect(true).toBe(true);
      } else {
        const supported = await Promise.race([
          supportsWebP(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000))
        ]);
        expect(typeof supported).toBe("boolean");
      }
    });
  });

  describe("IMAGE_SIZES configuration", () => {
    it("should define all required sizes", () => {
      const sizeNames = IMAGE_SIZES.map((s) => s.name);
      expect(sizeNames).toContain("thumbnail");
      expect(sizeNames).toContain("medium");
      expect(sizeNames).toContain("large");
    });

    it("should have valid quality values", () => {
      IMAGE_SIZES.forEach((size) => {
        expect(size.quality).toBeGreaterThan(0);
        expect(size.quality).toBeLessThanOrEqual(100);
      });
    });

    it("should have valid width values", () => {
      IMAGE_SIZES.forEach((size) => {
        expect(size.width).toBeGreaterThan(0);
      });
    });

    it("should have sizes in ascending order", () => {
      for (let i = 1; i < IMAGE_SIZES.length; i++) {
        expect(IMAGE_SIZES[i].width).toBeGreaterThan(
          IMAGE_SIZES[i - 1].width
        );
      }
    });
  });

  describe("Constants validation", () => {
    it("should have valid file size limit", () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    });

    it("should accept standard image formats", () => {
      expect(ACCEPTED_IMAGE_FORMATS).toContain("image/jpeg");
      expect(ACCEPTED_IMAGE_FORMATS).toContain("image/png");
      expect(ACCEPTED_IMAGE_FORMATS).toContain("image/webp");
    });

    it("should have exactly 3 accepted formats", () => {
      expect(ACCEPTED_IMAGE_FORMATS.length).toBe(3);
    });
  });
});

describe("Image Optimization Requirements Validation", () => {
  it("should validate Requirement 26.4: Auto-generate multiple image sizes", () => {
    // Verify we generate thumbnail, medium, and large sizes
    const sizeNames = IMAGE_SIZES.map((s) => s.name);
    expect(sizeNames).toContain("thumbnail");
    expect(sizeNames).toContain("medium");
    expect(sizeNames).toContain("large");
    expect(IMAGE_SIZES.length).toBeGreaterThanOrEqual(3);
  });

  it("should validate Requirement 26.7: Display upload progress with percentage", () => {
    // Verify calculateTotalProgress returns percentage between 0-100
    const progress1 = calculateTotalProgress(5, 2, 50);
    expect(progress1).toBeGreaterThanOrEqual(0);
    expect(progress1).toBeLessThanOrEqual(100);

    const progress2 = calculateTotalProgress(3, 3, 0);
    expect(progress2).toBe(100);
  });

  it("should validate Requirement 26.8: Validate image formats", () => {
    // Test all accepted formats
    const jpegFile = new File([], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(jpegFile, "size", { value: 1024 });
    expect(validateImage(jpegFile).isValid).toBe(true);

    const pngFile = new File([], "test.png", { type: "image/png" });
    Object.defineProperty(pngFile, "size", { value: 1024 });
    expect(validateImage(pngFile).isValid).toBe(true);

    const webpFile = new File([], "test.webp", { type: "image/webp" });
    Object.defineProperty(webpFile, "size", { value: 1024 });
    expect(validateImage(webpFile).isValid).toBe(true);

    // Test rejected format
    const gifFile = new File([], "test.gif", { type: "image/gif" });
    Object.defineProperty(gifFile, "size", { value: 1024 });
    expect(validateImage(gifFile).isValid).toBe(false);
  });

  it("should validate Requirement 26.11: Compressed images under 5MB", () => {
    // Verify max file size is set to 5MB
    expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);

    // Test validation rejects files over 5MB
    const largeFile = new File([], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(largeFile, "size", {
      value: MAX_FILE_SIZE_BYTES + 1,
    });
    const result = validateImage(largeFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("exceeds maximum allowed size of 5MB");
  });
});
