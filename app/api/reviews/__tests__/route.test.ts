/**
 * Tests for review submission functionality
 * Task 19.1: Implement review submission functionality
 * Requirements: 25.2, 25.3, 25.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, GET } from "../route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("POST /api/reviews", () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should reject unauthenticated requests", async () => {
    // Requirement 25.2: Allow authenticated users to submit reviews
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    mockRequest = new NextRequest("http://localhost:3000/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        reviewed_user_id: "user-123",
        listing_id: "listing-123",
        rating: 5,
        comment: "Great product!",
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should validate rating is between 1 and 5", async () => {
    // Requirement 25.2: Support rating (1-5 stars)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "reviewer-123" } },
      error: null,
    });

    // Test invalid rating (too high)
    mockRequest = new NextRequest("http://localhost:3000/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        reviewed_user_id: "user-123",
        listing_id: "listing-123",
        rating: 6,
        comment: "Great!",
      }),
    });

    let response = await POST(mockRequest);
    let data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");

    // Test invalid rating (too low)
    mockRequest = new NextRequest("http://localhost:3000/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        reviewed_user_id: "user-123",
        listing_id: "listing-123",
        rating: 0,
        comment: "Poor",
      }),
    });

    response = await POST(mockRequest);
    data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("should support optional images (up to 5)", async () => {
    // Requirement 25.2: Support optional images
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "550e8400-e29b-41d4-a716-446655440000" } },
      error: null,
    });

    // Setup mock chains with proper chaining support
    const mockFrom = vi.fn((table: string) => {
      if (table === "purchase_records") {
        const purchaseChain: any = {
          select: vi.fn(() => purchaseChain),
          eq: vi.fn(() => purchaseChain),
          in: vi.fn(() => purchaseChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
        return purchaseChain;
      }
      if (table === "escrow_transactions") {
        const escrowChain: any = {
          select: vi.fn(() => escrowChain),
          eq: vi.fn(() => escrowChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
        return escrowChain;
      }
      if (table === "reviews") {
        const reviewSelectChain: any = {
          eq: vi.fn(() => reviewSelectChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
        const reviewInsertChain: any = {
          select: vi.fn(() => reviewInsertChain),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "660e8400-e29b-41d4-a716-446655440000",
              reviewer_id: "550e8400-e29b-41d4-a716-446655440000",
              reviewed_user_id: "770e8400-e29b-41d4-a716-446655440000",
              listing_id: "880e8400-e29b-41d4-a716-446655440000",
              rating: 5,
              comment: "Great!",
              images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
              is_verified_purchase: false,
            },
            error: null,
          }),
        };
        return {
          select: vi.fn(() => reviewSelectChain),
          insert: vi.fn(() => reviewInsertChain),
        };
      }
      if (table === "users") {
        const userChain: any = {
          select: vi.fn(() => userChain),
          eq: vi.fn(() => userChain),
          single: vi.fn().mockResolvedValue({
            data: { phone_verified: true, nin_verified: false, video_verified: false },
          }),
        };
        const updateChain: any = {
          eq: vi.fn().mockResolvedValue({ data: null }),
        };
        return {
          select: vi.fn(() => userChain),
          update: vi.fn(() => updateChain),
        };
      }
      if (table === "notifications") {
        return {
          insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {};
    });

    mockSupabase.from = mockFrom;

    mockRequest = new NextRequest("http://localhost:3000/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        reviewed_user_id: "770e8400-e29b-41d4-a716-446655440000",
        listing_id: "880e8400-e29b-41d4-a716-446655440000",
        rating: 5,
        comment: "Great product!",
        images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    // Debug: log the actual response if test fails
    if (response.status !== 201) {
      console.log("Actual response:", data);
    }

    expect(response.status).toBe(201);
    expect(data.data.images).toHaveLength(2);
  });

  it("should verify purchase and set is_verified_purchase flag", async () => {
    // Requirement 25.3: Require purchase verification before publishing
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "550e8400-e29b-41d4-a716-446655440000" } },
      error: null,
    });

    // Mock purchase verification
    const mockPurchaseRecord = { id: "990e8400-e29b-41d4-a716-446655440000" };
    
    const mockFrom = vi.fn((table: string) => {
      if (table === "purchase_records") {
        const purchaseChain: any = {
          select: vi.fn(() => purchaseChain),
          eq: vi.fn(() => purchaseChain),
          in: vi.fn(() => purchaseChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockPurchaseRecord }),
        };
        return purchaseChain;
      }
      if (table === "reviews") {
        const reviewSelectChain: any = {
          eq: vi.fn(() => reviewSelectChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
        const reviewInsertChain: any = {
          select: vi.fn(() => reviewInsertChain),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "aa0e8400-e29b-41d4-a716-446655440000",
              reviewer_id: "550e8400-e29b-41d4-a716-446655440000",
              reviewed_user_id: "770e8400-e29b-41d4-a716-446655440000",
              listing_id: "880e8400-e29b-41d4-a716-446655440000",
              rating: 5,
              comment: "Verified purchase!",
              is_verified_purchase: true,
            },
            error: null,
          }),
        };
        return {
          select: vi.fn(() => reviewSelectChain),
          insert: vi.fn(() => reviewInsertChain),
        };
      }
      if (table === "users") {
        const userChain: any = {
          select: vi.fn(() => userChain),
          eq: vi.fn(() => userChain),
          single: vi.fn().mockResolvedValue({
            data: { phone_verified: true, nin_verified: false, video_verified: false },
          }),
        };
        const updateChain: any = {
          eq: vi.fn().mockResolvedValue({ data: null }),
        };
        return {
          select: vi.fn(() => userChain),
          update: vi.fn(() => updateChain),
        };
      }
      if (table === "notifications") {
        return {
          insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {};
    });

    mockSupabase.from = mockFrom;

    mockRequest = new NextRequest("http://localhost:3000/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        reviewed_user_id: "770e8400-e29b-41d4-a716-446655440000",
        listing_id: "880e8400-e29b-41d4-a716-446655440000",
        rating: 5,
        comment: "Verified purchase!",
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.is_verified_purchase).toBe(true);
  });

  it("should prevent duplicate reviews for the same listing", async () => {
    // Requirement 25.10: Prevent multiple reviews for same listing by same user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "550e8400-e29b-41d4-a716-446655440000" } },
      error: null,
    });

    // Mock existing review
    const mockExistingReview = { id: "bb0e8400-e29b-41d4-a716-446655440000" };
    
    const mockFrom = vi.fn((table: string) => {
      if (table === "purchase_records") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "escrow_transactions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "reviews") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockExistingReview }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    mockSupabase.from = mockFrom;

    mockRequest = new NextRequest("http://localhost:3000/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        reviewed_user_id: "770e8400-e29b-41d4-a716-446655440000",
        listing_id: "880e8400-e29b-41d4-a716-446655440000",
        rating: 4,
        comment: "Trying to review again",
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("You have already reviewed this listing");
  });

  it("should successfully create review with all fields", async () => {
    // Requirement 25.2: Support rating (1-5 stars), text, and optional images
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "550e8400-e29b-41d4-a716-446655440000" } },
      error: null,
    });

    const mockReviewData = {
      id: "cc0e8400-e29b-41d4-a716-446655440000",
      reviewer_id: "550e8400-e29b-41d4-a716-446655440000",
      reviewed_user_id: "770e8400-e29b-41d4-a716-446655440000",
      listing_id: "880e8400-e29b-41d4-a716-446655440000",
      vendor_id: "dd0e8400-e29b-41d4-a716-446655440000",
      rating: 5,
      comment: "Excellent product, highly recommended!",
      images: [
        "https://example.com/review1.jpg",
        "https://example.com/review2.jpg",
      ],
      is_verified_purchase: true,
      created_at: new Date().toISOString(),
    };

    const mockFrom = vi.fn((table: string) => {
      if (table === "purchase_records") {
        const purchaseChain: any = {
          select: vi.fn(() => purchaseChain),
          eq: vi.fn(() => purchaseChain),
          in: vi.fn(() => purchaseChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "purchase-123" } }),
        };
        return purchaseChain;
      }
      if (table === "reviews") {
        const reviewSelectChain: any = {
          eq: vi.fn(() => reviewSelectChain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
        const reviewInsertChain: any = {
          select: vi.fn(() => reviewInsertChain),
          single: vi.fn().mockResolvedValue({
            data: mockReviewData,
            error: null,
          }),
        };
        return {
          select: vi.fn(() => reviewSelectChain),
          insert: vi.fn(() => reviewInsertChain),
        };
      }
      if (table === "users") {
        const userChain: any = {
          select: vi.fn(() => userChain),
          eq: vi.fn(() => userChain),
          single: vi.fn().mockResolvedValue({
            data: { phone_verified: true, nin_verified: false, video_verified: false },
          }),
        };
        const updateChain: any = {
          eq: vi.fn().mockResolvedValue({ data: null }),
        };
        return {
          select: vi.fn(() => userChain),
          update: vi.fn(() => updateChain),
        };
      }
      if (table === "notifications") {
        return {
          insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {};
    });

    mockSupabase.from = mockFrom;

    mockRequest = new NextRequest("http://localhost:3000/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        reviewed_user_id: "770e8400-e29b-41d4-a716-446655440000",
        listing_id: "880e8400-e29b-41d4-a716-446655440000",
        vendor_id: "dd0e8400-e29b-41d4-a716-446655440000",
        rating: 5,
        comment: "Excellent product, highly recommended!",
        images: [
          "https://example.com/review1.jpg",
          "https://example.com/review2.jpg",
        ],
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toBeDefined();
    expect(data.data.rating).toBe(5);
    expect(data.data.comment).toBe("Excellent product, highly recommended!");
    expect(data.data.images).toHaveLength(2);
    expect(data.data.is_verified_purchase).toBe(true);
  });
});

describe("GET /api/reviews", () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should require listing_id or vendor_id parameter", async () => {
    mockRequest = new NextRequest("http://localhost:3000/api/reviews", {
      method: "GET",
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("listing_id or vendor_id is required");
  });

  it("should return reviews with average and rating distribution", async () => {
    // Requirement 25.1: Display average ratings
    // Requirement 25.4: Show 5-star breakdown
    const mockReviews = [
      { id: "1", rating: 5, comment: "Excellent", is_verified_purchase: true },
      { id: "2", rating: 4, comment: "Good", is_verified_purchase: false },
      { id: "3", rating: 5, comment: "Perfect", is_verified_purchase: true },
      { id: "4", rating: 3, comment: "Okay", is_verified_purchase: false },
      { id: "5", rating: 5, comment: "Amazing", is_verified_purchase: true },
    ];

    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockReviews,
            error: null,
          }),
        }),
      }),
    });

    mockRequest = new NextRequest(
      "http://localhost:3000/api/reviews?listing_id=listing-123",
      { method: "GET" }
    );

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.average).toBe(4.4); // (5+4+5+3+5)/5 = 4.4
    expect(data.count).toBe(5);
    expect(data.ratingDistribution).toEqual({
      5: 3,
      4: 1,
      3: 1,
      2: 0,
      1: 0,
    });
  });

  it("should support sorting by helpfulness, recency, or rating", async () => {
    // Requirement 25.9: Sort reviews by helpfulness, recency, or rating
    const mockReviews = [
      { id: "1", rating: 5, helpfulness_votes: 10 },
      { id: "2", rating: 4, helpfulness_votes: 5 },
    ];

    let orderByField: string | null = null;

    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockImplementation((field: string) => {
            orderByField = field;
            return Promise.resolve({ data: mockReviews, error: null });
          }),
        }),
      }),
    });

    // Test sort by helpfulness
    mockRequest = new NextRequest(
      "http://localhost:3000/api/reviews?listing_id=listing-123&sort=helpfulness",
      { method: "GET" }
    );

    await GET(mockRequest);
    expect(orderByField).toBe("helpfulness_votes");

    // Test sort by rating
    mockRequest = new NextRequest(
      "http://localhost:3000/api/reviews?listing_id=listing-123&sort=rating",
      { method: "GET" }
    );

    await GET(mockRequest);
    expect(orderByField).toBe("rating");

    // Test sort by recency (default)
    mockRequest = new NextRequest(
      "http://localhost:3000/api/reviews?listing_id=listing-123",
      { method: "GET" }
    );

    await GET(mockRequest);
    expect(orderByField).toBe("created_at");
  });
});
