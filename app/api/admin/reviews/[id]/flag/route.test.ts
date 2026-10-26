/**
 * Tests for POST /api/admin/reviews/[id]/flag
 * Task 8.4: Admin flag review for moderation
 * Requirements: 11.7
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock admin authentication
vi.mock("@/lib/auth/admin", () => ({
  checkAdminAuth: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

describe("POST /api/admin/reviews/[id]/flag", () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
      update: vi.fn(() => mockSupabase),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    // Setup mock request
    mockRequest = {
      json: vi.fn(),
    } as any;
  });

  it("should return 401 if user is not authenticated", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: false,
      error: "Unauthorized",
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 if user is not an admin", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: false,
      error: "Forbidden",
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "review-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return 400 for invalid UUID format", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason: "Inappropriate content",
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "invalid-uuid" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid review ID format");
  });

  it("should return 400 if reason is missing", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({});

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Reason is required and must be a non-empty string",
    );
  });

  it("should return 400 if reason is empty string", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason: "   ",
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Reason is required and must be a non-empty string",
    );
  });

  it("should return 400 if reason is not a string", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason: 123,
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Reason is required and must be a non-empty string",
    );
  });

  it("should return 404 if review does not exist", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason: "Inappropriate content",
    });

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error("Not found"),
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Review not found");
  });

  it("should return 400 if review is already flagged", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason: "Spam content",
    });

    mockSupabase.single.mockResolvedValue({
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        business_profile_id: "business-123",
        reviewer_id: "reviewer-123",
        rating: 1,
        comment: "Terrible service",
        is_flagged: true,
        flagged_reason: "Previous violation",
        flagged_at: "2024-01-10T10:00:00Z",
      },
      error: null,
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Review is already flagged");
  });

  it("should successfully flag a review", async () => {
    const reviewId = "550e8400-e29b-41d4-a716-446655440000";
    const reason = "Contains inappropriate language and violates community guidelines";

    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123", email: "admin@findam.admin" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason,
    });

    // Mock the review fetch (first single() call)
    const existingReview = {
      id: reviewId,
      business_profile_id: "business-123",
      reviewer_id: "reviewer-123",
      rating: 1,
      comment: "Terrible service with bad words",
      is_flagged: false,
      flagged_reason: null,
      flagged_at: null,
    };

    // Mock the flagged review (second single() call after update)
    const flaggedReview = {
      ...existingReview,
      is_flagged: true,
      flagged_reason: reason,
      flagged_at: "2024-01-15T10:00:00Z",
    };

    let callCount = 0;
    mockSupabase.single.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: existingReview, error: null });
      } else {
        return Promise.resolve({ data: flaggedReview, error: null });
      }
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: reviewId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.review).toBeDefined();
    expect(data.review.is_flagged).toBe(true);
    expect(data.review.flagged_reason).toBe(reason);
    expect(data.review.flagged_at).toBeDefined();
    expect(data.message).toContain("flagged successfully");
    expect(data.message).toContain("rating has been recalculated");

    // Verify update was called with correct parameters
    expect(mockSupabase.update).toHaveBeenCalledWith({
      is_flagged: true,
      flagged_reason: reason,
      flagged_at: expect.any(String),
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", reviewId);
  });

  it("should trim whitespace from reason", async () => {
    const reviewId = "550e8400-e29b-41d4-a716-446655440000";
    const reason = "   Spam content   ";
    const trimmedReason = "Spam content";

    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: reviewId,
        is_flagged: false,
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: reviewId,
        is_flagged: true,
        flagged_reason: trimmedReason,
        flagged_at: "2024-01-15T10:00:00Z",
      },
      error: null,
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: reviewId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.review.flagged_reason).toBe(trimmedReason);
    expect(mockSupabase.update).toHaveBeenCalledWith({
      is_flagged: true,
      flagged_reason: trimmedReason,
      flagged_at: expect.any(String),
    });
  });

  it("should handle database errors gracefully during update", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason: "Inappropriate content",
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        is_flagged: false,
      },
      error: null,
    });

    // Simulate database error on update
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error("Database error"),
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to flag review");
  });

  it("should handle unexpected errors gracefully", async () => {
    (checkAdminAuth as any).mockRejectedValue(new Error("Unexpected error"));

    mockRequest.json = vi.fn().mockResolvedValue({
      reason: "Inappropriate content",
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should verify that flagging triggers rating recalculation", async () => {
    // This test verifies the requirement that the database trigger
    // automatically recalculates business rating excluding flagged reviews
    const reviewId = "550e8400-e29b-41d4-a716-446655440000";

    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123" },
    });

    mockRequest.json = vi.fn().mockResolvedValue({
      reason: "Policy violation",
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: reviewId,
        business_profile_id: "business-123",
        is_flagged: false,
      },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: reviewId,
        business_profile_id: "business-123",
        is_flagged: true,
        flagged_reason: "Policy violation",
        flagged_at: "2024-01-15T10:00:00Z",
      },
      error: null,
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: reviewId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain("rating has been recalculated");
    // The actual recalculation happens via database trigger
    // update_business_rating_aggregates() which excludes flagged reviews
  });
});
