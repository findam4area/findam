/**
 * Tests for POST /api/business-reviews/[id]/respond
 * Task 8.3: Business owner response to reviews
 * Requirements: 11.6
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { businessOwnerResponseSchema } from "@/lib/validations/review";

// Mock Supabase client
vi.mock("@/lib/supabase/server");

// Mock validation
vi.mock("@/lib/validations/review");

describe("POST /api/business-reviews/[id]/respond", () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
      update: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // Setup mock request
    mockRequest = {
      json: vi.fn(),
    } as any;
  });

  it("should return 401 if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain("Unauthorized");
  });

  it("should return 400 if response text is invalid", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      response: "", // Empty response
    });

    vi.mocked(businessOwnerResponseSchema.safeParse).mockReturnValue({
      success: false,
      error: {
        errors: [
          { path: ["response"], message: "Response cannot be empty" },
        ],
      },
    } as any);

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
    expect(data.details).toBeDefined();
  });

  it("should return 404 if review does not exist", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      response: "Thank you for your feedback!",
    });

    vi.mocked(businessOwnerResponseSchema.safeParse).mockReturnValue({
      success: true,
      data: { response: "Thank you for your feedback!" },
    } as any);

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error("Not found"),
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Review not found");
  });

  it("should return 403 if user does not own the business", async () => {
    const userId = "user-123";
    const differentUserId = "user-456";

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      response: "Thank you for your feedback!",
    });

    vi.mocked(businessOwnerResponseSchema.safeParse).mockReturnValue({
      success: true,
      data: { response: "Thank you for your feedback!" },
    } as any);

    mockSupabase.single.mockResolvedValue({
      data: {
        id: "review-123",
        business_profile_id: "business-123",
        reviewer_id: "reviewer-123",
        rating: 5,
        comment: "Great service!",
        owner_response: null,
        responded_at: null,
        business_profile: {
          id: "business-123",
          user_id: differentUserId, // Different user owns this business
          business_name: "Test Business",
        },
      },
      error: null,
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Only the business owner");
  });

  it("should return 409 if review already has a response", async () => {
    const userId = "user-123";

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      response: "Thank you for your feedback!",
    });

    vi.mocked(businessOwnerResponseSchema.safeParse).mockReturnValue({
      success: true,
      data: { response: "Thank you for your feedback!" },
    } as any);

    mockSupabase.single.mockResolvedValue({
      data: {
        id: "review-123",
        business_profile_id: "business-123",
        reviewer_id: "reviewer-123",
        rating: 5,
        comment: "Great service!",
        owner_response: "Thank you!", // Already has a response
        responded_at: "2024-01-15T10:00:00Z",
        business_profile: {
          id: "business-123",
          user_id: userId,
          business_name: "Test Business",
        },
      },
      error: null,
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("already has a response");
    expect(data.existing_response).toBeDefined();
  });

  it("should successfully add owner response to review", async () => {
    const userId = "user-123";
    const responseText = "Thank you for your feedback! We appreciate your business.";

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      response: responseText,
    });

    vi.mocked(businessOwnerResponseSchema.safeParse).mockReturnValue({
      success: true,
      data: { response: responseText },
    } as any);

    // Mock the review fetch (first single() call)
    const reviewData = {
      id: "review-123",
      business_profile_id: "business-123",
      reviewer_id: "reviewer-123",
      rating: 5,
      comment: "Great service!",
      owner_response: null,
      responded_at: null,
      business_profile: {
        id: "business-123",
        user_id: userId,
        business_name: "Test Business",
      },
    };

    // Mock the updated review (second single() call after update)
    const updatedReviewData = {
      ...reviewData,
      owner_response: responseText,
      responded_at: "2024-01-15T10:00:00Z",
      reviewer: {
        id: "reviewer-123",
        full_name: "John Doe",
        username: "johndoe",
        avatar_url: "https://example.com/avatar.jpg",
      },
    };

    let callCount = 0;
    mockSupabase.single.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: reviewData, error: null });
      } else {
        return Promise.resolve({ data: updatedReviewData, error: null });
      }
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Response added successfully");
    expect(data.review).toBeDefined();
    expect(data.review.owner_response).toBe(responseText);
    expect(data.review.responded_at).toBeDefined();
    expect(mockSupabase.update).toHaveBeenCalledWith({
      owner_response: responseText,
      responded_at: expect.any(String),
    });
  });

  it("should handle database errors gracefully", async () => {
    const userId = "user-123";

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      response: "Thank you for your feedback!",
    });

    vi.mocked(businessOwnerResponseSchema.safeParse).mockReturnValue({
      success: true,
      data: { response: "Thank you for your feedback!" },
    } as any);

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "review-123",
        business_profile_id: "business-123",
        reviewer_id: "reviewer-123",
        rating: 5,
        comment: "Great service!",
        owner_response: null,
        responded_at: null,
        business_profile: {
          id: "business-123",
          user_id: userId,
          business_name: "Test Business",
        },
      },
      error: null,
    });

    // Simulate database error on update
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error("Database error"),
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to add response to review");
  });
});
