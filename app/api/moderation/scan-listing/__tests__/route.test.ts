/**
 * Unit tests for POST /api/moderation/scan-listing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: "test-user-id" } },
        error: null,
      })),
    },
  })),
}));

// Mock content moderation service
vi.mock("@/lib/services/content-moderation", () => ({
  contentModerationService: {
    scanListing: vi.fn(),
    storeModerationResult: vi.fn(),
    shouldBlockListing: vi.fn(),
    getRejectionReason: vi.fn(),
    getFlaggingReason: vi.fn(),
  },
}));

describe("POST /api/moderation/scan-listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should scan a listing and return moderation result", async () => {
    const { contentModerationService } =
      await import("@/lib/services/content-moderation");

    vi.mocked(contentModerationService.scanListing).mockResolvedValue({
      approved: true,
      confidence: 10,
      action: "approve",
      violations: [],
      scannedContent: {
        title: "Test Listing",
        description: "Test description",
        price: 1000,
        category: "electronics",
      },
    });

    vi.mocked(contentModerationService.shouldBlockListing).mockReturnValue(
      false,
    );

    const request = new NextRequest(
      "http://localhost:3000/api/moderation/scan-listing",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Test Listing",
          description: "Test description",
          price: 1000,
          category: "electronics",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.approved).toBe(true);
    expect(data.action).toBe("approve");
    expect(data.shouldBlock).toBe(false);
  });

  it("should reject listings with high confidence violations", async () => {
    const { contentModerationService } =
      await import("@/lib/services/content-moderation");

    vi.mocked(contentModerationService.scanListing).mockResolvedValue({
      approved: false,
      confidence: 90,
      action: "reject",
      violations: [
        {
          type: "prohibited_content",
          severity: "high",
          details: "Prohibited content detected",
          confidence: 90,
        },
      ],
      scannedContent: {
        title: "Bad Listing",
        description: "Bad content",
        price: 1000,
        category: "other",
      },
    });

    vi.mocked(contentModerationService.shouldBlockListing).mockReturnValue(
      true,
    );
    vi.mocked(contentModerationService.getRejectionReason).mockReturnValue(
      "Your listing has been rejected: Prohibited content detected",
    );

    const request = new NextRequest(
      "http://localhost:3000/api/moderation/scan-listing",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Bad Listing",
          description: "Bad content",
          price: 1000,
          category: "other",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.approved).toBe(false);
    expect(data.action).toBe("reject");
    expect(data.shouldBlock).toBe(true);
    expect(data.reason).toContain("Prohibited content detected");
  });

  it("should return 400 for missing required fields", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/moderation/scan-listing",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Test",
          // Missing description, price, category
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });
});
