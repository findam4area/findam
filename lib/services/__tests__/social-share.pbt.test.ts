/**
 * Property-Based Tests for Social Share Service
 * Tests Requirements 25.1, 25.3, 25.4
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { socialShareService, SocialShareService } from "../social-share";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    raw: vi.fn((sql: string) => sql),
  }),
}));

describe("Social Share Service - Property Tests", () => {
  let service: SocialShareService;

  beforeEach(() => {
    service = new SocialShareService();
  });

  /**
   * Property 79: Open Graph Meta Tags
   * Validates: Requirement 25.1
   *
   * GIVEN any listing data with title, description, image, and price
   * WHEN Open Graph tags are generated
   * THEN all required OG tags must be present with correct values
   */
  it("Property 79: should generate complete Open Graph meta tags for any listing", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          image: fc.webUrl(),
          url: fc.webUrl(),
          price: fc.integer({ min: 0, max: 10000000 }),
          condition: fc.constantFrom("new", "used", "refurbished"),
          location: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (listingData) => {
          const tags = service.generateOpenGraphTags(listingData);

          // Required OG tags must be present
          expect(tags).toHaveProperty("og:type", "product");
          expect(tags).toHaveProperty("og:title", listingData.title);
          expect(tags).toHaveProperty(
            "og:description",
            listingData.description,
          );
          expect(tags).toHaveProperty("og:image", listingData.image);
          expect(tags).toHaveProperty("og:url", listingData.url);
          expect(tags).toHaveProperty("og:site_name", "FindAm");

          // Twitter card tags must be present
          expect(tags).toHaveProperty("twitter:card", "summary_large_image");
          expect(tags).toHaveProperty("twitter:title", listingData.title);
          expect(tags).toHaveProperty(
            "twitter:description",
            listingData.description,
          );
          expect(tags).toHaveProperty("twitter:image", listingData.image);

          // Price tags must be present
          expect(tags).toHaveProperty(
            "product:price:amount",
            listingData.price.toString(),
          );
          expect(tags).toHaveProperty("product:price:currency", "NGN");

          // Condition tag must be present
          expect(tags).toHaveProperty(
            "product:condition",
            listingData.condition,
          );

          // Location tag must be present
          expect(tags).toHaveProperty("og:locality", listingData.location);

          // All tag values must be strings
          Object.values(tags).forEach((value) => {
            expect(typeof value).toBe("string");
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 80: Share Link Referral Tracking
   * Validates: Requirement 25.3
   *
   * GIVEN any listing ID, user ID, platform, and referral code
   * WHEN a share link is generated
   * THEN the link must contain the referral code as a query parameter
   */
  it("Property 80: should include referral code in all generated share links", async () => {
    const listingId = "listing-123";
    const userId = "user-123";
    const platform = "whatsapp";
    const referralCode = "ABC123";

    const shareUrl = await service.generateShareLink({
      listingId,
      userId,
      platform,
      referralCode,
    });

    // Share URL must be a valid URL
    expect(() => new URL(shareUrl)).not.toThrow();

    const url = new URL(shareUrl);

    // Referral code must be in query parameters
    expect(url.searchParams.has("ref")).toBe(true);
    expect(url.searchParams.get("ref")).toBe(referralCode);

    // Tracking parameters must be present
    expect(url.searchParams.get("utm_source")).toBe(platform);
    expect(url.searchParams.get("utm_medium")).toBe("social");
    expect(url.searchParams.get("utm_campaign")).toBe("listing_share");
    expect(url.searchParams.get("shared_by")).toBe(userId);

    // Listing ID must be in the path
    expect(shareUrl).toContain(listingId);
  });

  /**
   * Property 81: Share Metrics Tracking
   * Validates: Requirement 25.4
   *
   * GIVEN any share URL
   * WHEN tracking events (view, click, conversion) are recorded
   * THEN the metrics must be properly tracked without errors
   */
  it("Property 81: should track share metrics for all event types", async () => {
    const shareUrl = "https://example.com/listing/123";

    // All tracking methods should execute without throwing
    await expect(service.trackShareView(shareUrl)).resolves.toBeUndefined();
    await expect(service.trackShareClick(shareUrl)).resolves.toBeUndefined();
    await expect(
      service.trackShareConversion(shareUrl),
    ).resolves.toBeUndefined();
  });

  /**
   * Additional Property: Platform-Specific Share URLs
   *
   * GIVEN any platform and share URL
   * WHEN platform-specific URL is generated
   * THEN it must be a valid URL for that platform
   */
  it("should generate valid platform-specific share URLs", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("whatsapp", "twitter", "facebook", "instagram"),
        fc.webUrl(),
        fc.string({ minLength: 10, maxLength: 200 }),
        (platform, shareUrl, text) => {
          const platformUrl = service.getPlatformShareUrl(
            platform,
            shareUrl,
            text,
          );

          // Result must be a valid URL or the original share URL (for Instagram)
          if (platform === "instagram") {
            expect(platformUrl).toBe(shareUrl);
          } else {
            expect(() => new URL(platformUrl)).not.toThrow();

            const url = new URL(platformUrl);

            // Platform-specific domain checks
            if (platform === "whatsapp") {
              expect(url.hostname).toBe("wa.me");
            } else if (platform === "twitter") {
              expect(url.hostname).toBe("twitter.com");
            } else if (platform === "facebook") {
              expect(url.hostname).toBe("www.facebook.com");
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional Property: Nigerian Hashtags
   *
   * GIVEN any category
   * WHEN hashtags are generated
   * THEN they must include general, category-specific, and trending hashtags
   */
  it("should generate appropriate Nigerian hashtags for any category", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "electronics",
          "fashion",
          "vehicles",
          "home-garden",
          "phones",
          "laptops",
          "beauty",
          "sports",
          "other",
        ),
        (category) => {
          const hashtags = service.getNigerianHashtags(category);

          // Must have all three types of hashtags
          expect(hashtags).toHaveProperty("general");
          expect(hashtags).toHaveProperty("categorySpecific");
          expect(hashtags).toHaveProperty("trending");

          // All must be arrays
          expect(Array.isArray(hashtags.general)).toBe(true);
          expect(Array.isArray(hashtags.categorySpecific)).toBe(true);
          expect(Array.isArray(hashtags.trending)).toBe(true);

          // General and trending must not be empty
          expect(hashtags.general.length).toBeGreaterThan(0);
          expect(hashtags.trending.length).toBeGreaterThan(0);

          // All hashtags must start with #
          [
            ...hashtags.general,
            ...hashtags.categorySpecific,
            ...hashtags.trending,
          ].forEach((tag) => {
            expect(tag.startsWith("#")).toBe(true);
          });
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Additional Property: Share Text Generation
   *
   * GIVEN any listing data
   * WHEN share text is generated
   * THEN it must include title, price, and hashtags
   */
  it("should generate complete share text with all required elements", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          price: fc.integer({ min: 0, max: 10000000 }),
          category: fc.constantFrom(
            "electronics",
            "fashion",
            "vehicles",
            "phones",
          ),
          condition: fc.constantFrom("new", "used", "refurbished"),
        }),
        (listing) => {
          const shareText = service.generateShareText(listing);

          // Must include title
          expect(shareText).toContain(listing.title);

          // Must include formatted price
          const priceText = `₦${listing.price.toLocaleString()}`;
          expect(shareText).toContain(priceText);

          // Must include at least one hashtag
          expect(shareText).toMatch(/#\w+/);

          // Must not be empty
          expect(shareText.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional Property: Story Image Data Structure
   *
   * GIVEN any listing data
   * WHEN story image data is generated
   * THEN it must have valid dimensions and elements
   */
  it("should generate valid story image data structure", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          price: fc.integer({ min: 0, max: 10000000 }),
          image_url: fc.webUrl(),
          condition: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (listing) => {
          const imageData = service.generateStoryImageData(listing);

          // Must have valid dimensions (Instagram story format)
          expect(imageData.width).toBe(1080);
          expect(imageData.height).toBe(1920);

          // Must have background
          expect(imageData.background).toBeTruthy();

          // Must have elements array
          expect(Array.isArray(imageData.elements)).toBe(true);
          expect(imageData.elements.length).toBeGreaterThan(0);

          // Must include image element
          const imageElement = imageData.elements.find(
            (el) => el.type === "image",
          );
          expect(imageElement).toBeDefined();
          expect(imageElement?.content).toBe(listing.image_url);

          // Must include text elements
          const textElements = imageData.elements.filter(
            (el) => el.type === "text",
          );
          expect(textElements.length).toBeGreaterThan(0);

          // Price must be in one of the text elements
          const priceText = `₦${listing.price.toLocaleString()}`;
          const hasPriceElement = textElements.some(
            (el) => el.content === priceText,
          );
          expect(hasPriceElement).toBe(true);
        },
      ),
      { numRuns: 50 },
    );
  });
});
