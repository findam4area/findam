/**
 * Unit tests for video validation functions
 * Requirements: 1.1
 */

import { describe, it, expect } from "vitest";
import {
  validateVideoDuration,
  validateVideoListing,
  type VideoListingDB,
} from "../video";

describe("validateVideoDuration", () => {
  it("should accept valid duration of 15 seconds", () => {
    const result = validateVideoDuration(15);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should accept valid duration of 60 seconds", () => {
    const result = validateVideoDuration(60);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should accept valid duration between 15 and 60 seconds", () => {
    const result = validateVideoDuration(30);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject duration less than 15 seconds", () => {
    const result = validateVideoDuration(14);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Video duration must be at least 15 seconds",
    );
  });

  it("should reject duration greater than 60 seconds", () => {
    const result = validateVideoDuration(61);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Video duration must not exceed 60 seconds",
    );
  });

  it("should reject non-numeric duration", () => {
    const result = validateVideoDuration(NaN);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Duration must be a valid number");
  });
});

describe("validateVideoListing", () => {
  const validVideoListing: Partial<VideoListingDB> = {
    listing_id: "123e4567-e89b-12d3-a456-426614174000",
    video_url: "https://res.cloudinary.com/demo/video/upload/v1/sample.mp4",
    thumbnail_url: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    duration_seconds: 30,
  };

  it("should accept valid video listing", () => {
    const result = validateVideoListing(validVideoListing);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject video listing without listing_id", () => {
    const invalid = { ...validVideoListing };
    delete invalid.listing_id;
    const result = validateVideoListing(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Listing ID is required");
  });

  it("should reject video listing without video_url", () => {
    const invalid = { ...validVideoListing };
    delete invalid.video_url;
    const result = validateVideoListing(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Video URL is required");
  });

  it("should reject video listing without thumbnail_url", () => {
    const invalid = { ...validVideoListing };
    delete invalid.thumbnail_url;
    const result = validateVideoListing(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Thumbnail URL is required");
  });

  it("should reject video listing without duration", () => {
    const invalid = { ...validVideoListing };
    delete invalid.duration_seconds;
    const result = validateVideoListing(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Duration is required");
  });

  it("should reject video listing with invalid duration", () => {
    const invalid = { ...validVideoListing, duration_seconds: 5 };
    const result = validateVideoListing(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Video duration must be at least 15 seconds",
    );
  });

  it("should accumulate multiple validation errors", () => {
    const invalid: Partial<VideoListingDB> = {
      duration_seconds: 100,
    };
    const result = validateVideoListing(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors).toContain("Listing ID is required");
    expect(result.errors).toContain("Video URL is required");
    expect(result.errors).toContain("Thumbnail URL is required");
    expect(result.errors).toContain(
      "Video duration must not exceed 60 seconds",
    );
  });
});
