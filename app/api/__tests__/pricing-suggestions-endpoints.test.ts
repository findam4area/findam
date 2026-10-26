/**
 * Tests for Pricing Suggestions API Endpoints
 * Tests task 62 requirements
 */

import { describe, it, expect, vi } from "vitest";

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextRequest: class {
    public url: string;
    public nextUrl: { searchParams: URLSearchParams };
    public json: any;

    constructor(url: string) {
      this.url = url;
      const urlObj = new URL(url);
      this.nextUrl = {
        searchParams: urlObj.searchParams,
      };
      this.json = vi.fn().mockResolvedValue({});
    }
  },
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
      ...data,
    }),
  },
}));

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "test-user-123",
            email: "test@example.com",
          },
        },
        error: null,
      }),
    },
  }),
}));

// Mock pricing suggestion service
vi.mock("@/lib/services/pricing-suggestion", () => ({
  pricingSuggestionService: {
    generatePricingSuggestion: vi.fn().mockResolvedValue({
      suggested_price: 50000,
      min_price: 45000,
      max_price: 55000,
      confidence_score: 75,
      market_average: 51000,
      similar_items_count: 10,
      avg_selling_time_days: 14,
      price_at_different_points: [
        { price: 45000, avg_days_to_sell: 20 },
        { price: 50000, avg_days_to_sell: 14 },
        { price: 55000, avg_days_to_sell: 10 },
      ],
      seasonal_adjustment: 5,
      price_history: [
        {
          date: "2024-01-01",
          avg_price: 48000,
          min_price: 40000,
          max_price: 56000,
        },
        {
          date: "2024-02-01",
          avg_price: 50000,
          min_price: 42000,
          max_price: 58000,
        },
      ],
      deviation_alert: {
        type: "above",
        percentage: 10,
        message: "Price is 10% above market average",
      },
    }),
    getPricingSuggestion: vi.fn().mockResolvedValue({
      id: "suggestion-123",
      listing_id: "listing-123",
      user_id: "test-user-123",
      suggested_price: 50000,
      min_price: 45000,
      max_price: 55000,
      confidence_score: 75,
      market_average: 51000,
      similar_items_count: 10,
      avg_selling_time_days: 14,
      factors_considered: {
        condition: "used",
        category: "electronics",
      },
      seasonal_adjustment: 5,
      price_history: [],
      suggestion_accepted: false,
      actual_price_set: null,
      price_deviation_percentage: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }),
    acceptPricingSuggestion: vi.fn().mockResolvedValue(true),
    checkPriceReductionNeeded: vi.fn().mockResolvedValue({
      needed: true,
      suggested_reduction: 5000,
      message: "Consider reducing price by ₦5,000",
    }),
  },
}));

describe("Pricing Suggestions API Endpoints", () => {
  describe("POST /api/pricing-suggestions", () => {
    it("should generate pricing suggestion for valid request", async () => {
      const { POST } = await import("../pricing-suggestions/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions",
        {
          method: "POST",
        },
      );
      request.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        factors: {
          condition: "used",
          category: "electronics",
          location: "Lagos",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.suggested_price).toBe(50000);
      expect(data.analysis.confidence_score).toBe(75);
      expect(data.analysis.similar_items_count).toBe(10);
    }, 15000); // 15 second timeout

    it("should return error for missing category", async () => {
      const { POST } = await import("../pricing-suggestions/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions",
        {
          method: "POST",
        },
      );
      request.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        factors: {
          condition: "used",
          // Missing category
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing required fields");
    }, 15000); // 15 second timeout

    it("should include price history in response", async () => {
      const { POST } = await import("../pricing-suggestions/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions",
        {
          method: "POST",
        },
      );
      request.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        factors: {
          condition: "used",
          category: "electronics",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.analysis.price_history).toBeDefined();
      expect(Array.isArray(data.analysis.price_history)).toBe(true);
      expect(data.analysis.price_history.length).toBeGreaterThan(0);
    });

    it("should include selling time estimates", async () => {
      const { POST } = await import("../pricing-suggestions/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions",
        {
          method: "POST",
        },
      );
      request.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        factors: {
          condition: "used",
          category: "electronics",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.analysis.avg_selling_time_days).toBe(14);
      expect(data.analysis.price_at_different_points).toBeDefined();
      expect(Array.isArray(data.analysis.price_at_different_points)).toBe(true);
    });
  });

  describe("GET /api/pricing-suggestions?listingId=xxx", () => {
    it("should return existing pricing suggestion", async () => {
      const { GET } = await import("../pricing-suggestions/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions?listingId=listing-123",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.suggestion).toBeDefined();
      expect(data.suggestion.listing_id).toBe("listing-123");
      expect(data.suggestion.suggested_price).toBe(50000);
    });

    it("should return error for missing listingId", async () => {
      const { GET } = await import("../pricing-suggestions/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing required parameter");
    });
  });

  describe("GET /api/pricing-suggestions/:id", () => {
    it("should return pricing suggestion by listing ID", async () => {
      const { GET } = await import("../pricing-suggestions/[id]/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions/listing-123",
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: "listing-123" }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.suggestion).toBeDefined();
      expect(data.suggestion.id).toBe("suggestion-123");
      expect(data.suggestion.listing_id).toBe("listing-123");
    }, 15000); // 15 second timeout

    it("should include all suggestion details", async () => {
      const { GET } = await import("../pricing-suggestions/[id]/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions/listing-123",
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: "listing-123" }),
      });
      const data = await response.json();

      expect(data.suggestion.suggested_price).toBeDefined();
      expect(data.suggestion.min_price).toBeDefined();
      expect(data.suggestion.max_price).toBeDefined();
      expect(data.suggestion.confidence_score).toBeDefined();
      expect(data.suggestion.market_average).toBeDefined();
      expect(data.suggestion.similar_items_count).toBeDefined();
    });
  });

  describe("POST /api/pricing-suggestions/:id/accept", () => {
    it("should accept pricing suggestion", async () => {
      const { POST } = await import("../pricing-suggestions/[id]/accept/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions/suggestion-123/accept",
        {
          method: "POST",
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: "suggestion-123" }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain("accepted");
    });

    it("should update listing price when accepting", async () => {
      const { POST } = await import("../pricing-suggestions/[id]/accept/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions/suggestion-123/accept",
        {
          method: "POST",
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: "suggestion-123" }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain("listing price updated");
    });
  });

  describe("GET /api/pricing-suggestions/:id/check-reduction", () => {
    it("should check if price reduction is needed", async () => {
      const { GET } =
        await import("../pricing-suggestions/[id]/check-reduction/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions/listing-123/check-reduction",
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: "listing-123" }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.needed).toBe(true);
      expect(data.suggested_reduction).toBe(5000);
      expect(data.message).toBeDefined();
    });

    it("should provide helpful message for price reduction", async () => {
      const { GET } =
        await import("../pricing-suggestions/[id]/check-reduction/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions/listing-123/check-reduction",
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: "listing-123" }),
      });
      const data = await response.json();

      expect(data.message).toContain("₦");
      expect(data.message.length).toBeGreaterThan(0);
    });
  });

  describe("Pricing Suggestion Workflow", () => {
    it("should support complete pricing suggestion workflow", async () => {
      const { POST: generatePost } =
        await import("../pricing-suggestions/route");
      const { GET: getById } =
        await import("../pricing-suggestions/[id]/route");
      const { POST: acceptPost } =
        await import("../pricing-suggestions/[id]/accept/route");
      const { NextRequest } = await import("next/server");

      // Step 1: Generate pricing suggestion
      const generateRequest = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions",
        {
          method: "POST",
        },
      );
      generateRequest.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        factors: {
          condition: "used",
          category: "electronics",
        },
      });

      const generateResponse = await generatePost(generateRequest);
      const generateData = await generateResponse.json();

      expect(generateData.success).toBe(true);
      expect(generateData.analysis.suggested_price).toBeDefined();

      // Step 2: Get pricing suggestion
      const getRequest = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions/listing-123",
      );

      const getResponse = await getById(getRequest, {
        params: Promise.resolve({ id: "listing-123" }),
      });
      const getData = await getResponse.json();

      expect(getData.success).toBe(true);
      expect(getData.suggestion).toBeDefined();

      // Step 3: Accept pricing suggestion
      const acceptRequest = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions/suggestion-123/accept",
        {
          method: "POST",
        },
      );

      const acceptResponse = await acceptPost(acceptRequest, {
        params: Promise.resolve({ id: "suggestion-123" }),
      });
      const acceptData = await acceptResponse.json();

      expect(acceptData.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle service errors gracefully", async () => {
      const { pricingSuggestionService } =
        await import("@/lib/services/pricing-suggestion");

      // Mock service to throw error
      vi.mocked(
        pricingSuggestionService.generatePricingSuggestion,
      ).mockRejectedValueOnce(new Error("Service error"));

      const { POST } = await import("../pricing-suggestions/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/pricing-suggestions",
        {
          method: "POST",
        },
      );
      request.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        factors: {
          condition: "used",
          category: "electronics",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
