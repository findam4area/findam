/**
 * Tests for Social and Gamification API Endpoints
 * Tests task 58 requirements
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextRequest: class {
    public url: string;
    public nextUrl: { searchParams: URLSearchParams };
    public json: any;

    constructor(url: string, init?: any) {
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
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "listing-123",
          title: "Test Listing",
          price: 10000,
          image_url: "https://example.com/image.jpg",
          condition: "new",
          category_id: "cat-123",
        },
        error: null,
      }),
    })),
  }),
}));

// Mock services
vi.mock("@/lib/services/social-share", () => ({
  socialShareService: {
    generateShareLink: vi
      .fn()
      .mockResolvedValue("https://findam.ng/listing/123?ref=ABC123"),
    generateShareText: vi
      .fn()
      .mockReturnValue("Check out this Test Listing for ₦10,000! #FindAm"),
    getPlatformShareUrl: vi.fn().mockReturnValue("https://wa.me/?text=..."),
    getListingShareMetrics: vi.fn().mockResolvedValue({
      total_shares: 5,
      total_views: 50,
      total_clicks: 25,
      total_conversions: 3,
      by_platform: { whatsapp: 3, twitter: 2 },
    }),
  },
}));

vi.mock("@/lib/services/gamification", () => ({
  gamificationService: {
    getUserAchievements: vi.fn().mockResolvedValue([
      {
        id: "ua-1",
        user_id: "test-user-123",
        achievement_id: "ach-1",
        is_displayed: true,
        earned_at: "2024-01-01",
        achievement: {
          id: "ach-1",
          badge_type: "first_listing",
          name: "First Steps",
          description: "Posted your first listing",
          icon: "package",
          category: "milestone",
          rarity: "common",
        },
      },
    ]),
    getUserLevel: vi.fn().mockResolvedValue({
      id: "level-1",
      user_id: "test-user-123",
      level: 5,
      current_points: 50,
      total_points: 550,
      points_to_next_level: 500,
      current_streak_days: 7,
      longest_streak_days: 10,
      listings_posted: 10,
      items_sold: 5,
      items_purchased: 3,
      reviews_given: 2,
      referrals_made: 1,
      unlocked_perks: ["priority_support"],
      free_boosts_remaining: 1,
    }),
    getAllAchievements: vi.fn().mockResolvedValue([
      {
        id: "ach-1",
        badge_type: "first_listing",
        name: "First Steps",
        description: "Posted your first listing",
        icon: "package",
        category: "milestone",
        rarity: "common",
        is_active: true,
      },
      {
        id: "ach-2",
        badge_type: "first_sale",
        name: "First Sale",
        description: "Made your first sale",
        icon: "shopping-bag",
        category: "milestone",
        rarity: "common",
        is_active: true,
      },
    ]),
    awardBadge: vi.fn().mockResolvedValue({
      id: "ach-1",
      badge_type: "first_listing",
      name: "First Steps",
      description: "Posted your first listing",
      icon: "package",
      category: "milestone",
      rarity: "common",
    }),
    getLeaderboard: vi.fn().mockResolvedValue([
      {
        user_id: "user-1",
        username: "topuser",
        avatar_url: null,
        level: 10,
        total_points: 1000,
        items_sold: 50,
        items_purchased: 20,
        rank: 1,
      },
      {
        user_id: "user-2",
        username: "seconduser",
        avatar_url: null,
        level: 8,
        total_points: 800,
        items_sold: 40,
        items_purchased: 15,
        rank: 2,
      },
    ]),
  },
}));

describe("Social and Gamification API Endpoints", () => {
  describe("POST /api/share", () => {
    it("should create share link and return metrics", async () => {
      const { POST } = await import("../share/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/share", {
        method: "POST",
      });
      request.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        platform: "whatsapp",
        referralCode: "ABC123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.shareUrl).toBeDefined();
      expect(data.platformUrl).toBeDefined();
      expect(data.shareText).toBeDefined();
      expect(data.metrics).toBeDefined();
      expect(data.metrics.total_shares).toBeGreaterThan(0);
    });

    it("should return error for missing required fields", async () => {
      const { POST } = await import("../share/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/share", {
        method: "POST",
      });
      request.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        // Missing platform
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing required fields");
    });

    it("should return error for invalid platform", async () => {
      const { POST } = await import("../share/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/share", {
        method: "POST",
      });
      request.json = vi.fn().mockResolvedValue({
        listingId: "listing-123",
        platform: "invalid-platform",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid platform");
    });
  });

  describe("GET /api/share", () => {
    it("should return share metrics for a listing", async () => {
      const { GET } = await import("../share/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/share?listingId=listing-123",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.listingId).toBe("listing-123");
      expect(data.metrics).toBeDefined();
      expect(data.metrics.total_shares).toBeDefined();
      expect(data.metrics.total_views).toBeDefined();
    });

    it("should return error for missing listingId", async () => {
      const { GET } = await import("../share/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/share");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing required parameter");
    });
  });

  describe("GET /api/achievements", () => {
    it("should return user achievements and progress", async () => {
      const { GET } = await import("../achievements/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/achievements");

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.userId).toBeDefined();
      expect(data.progress).toBeDefined();
      expect(data.progress.earned).toBeDefined();
      expect(data.progress.total).toBeDefined();
      expect(data.progress.percentage).toBeDefined();
      expect(data.level).toBeDefined();
      expect(data.achievements).toBeDefined();
      expect(data.stats).toBeDefined();
    });

    it("should return public achievements for specific user", async () => {
      const { GET } = await import("../achievements/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/achievements?userId=other-user-123",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.userId).toBe("other-user-123");
      expect(data.achievements).toBeDefined();
      // Should only show displayed achievements for public view
      expect(data.achievements.every((a: any) => a.is_displayed)).toBe(true);
    });
  });

  describe("POST /api/achievements", () => {
    it("should award achievement badge", async () => {
      const { POST } = await import("../achievements/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/achievements",
        {
          method: "POST",
        },
      );
      request.json = vi.fn().mockResolvedValue({
        badgeType: "first_listing",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.achievement).toBeDefined();
      expect(data.achievement.badge_type).toBe("first_listing");
      expect(data.message).toContain("unlocked");
    });

    it("should return error for missing badgeType", async () => {
      const { POST } = await import("../achievements/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/achievements",
        {
          method: "POST",
        },
      );
      request.json = vi.fn().mockResolvedValue({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing required field");
    });
  });

  describe("GET /api/leaderboard", () => {
    it("should return leaderboard with default category (points)", async () => {
      const { GET } = await import("../leaderboard/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/leaderboard");

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.category).toBe("points");
      expect(data.label).toBe("Top Contributors");
      expect(data.metric).toBe("total_points");
      expect(data.leaderboard).toBeDefined();
      expect(Array.isArray(data.leaderboard)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.highlights).toBeDefined();
    });

    it("should return sellers leaderboard", async () => {
      const { GET } = await import("../leaderboard/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/leaderboard?category=sellers",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.category).toBe("sellers");
      expect(data.label).toBe("Top Sellers");
      expect(data.metric).toBe("items_sold");
    });

    it("should return buyers leaderboard", async () => {
      const { GET } = await import("../leaderboard/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/leaderboard?category=buyers",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.category).toBe("buyers");
      expect(data.label).toBe("Top Buyers");
      expect(data.metric).toBe("items_purchased");
    });

    it("should handle pagination", async () => {
      const { GET } = await import("../leaderboard/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/leaderboard?limit=10&offset=5",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(5);
      expect(data.pagination.current_page).toBe(1);
    });

    it("should return error for invalid category", async () => {
      const { GET } = await import("../leaderboard/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/leaderboard?category=invalid",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid category");
    });

    it("should return error for invalid limit", async () => {
      const { GET } = await import("../leaderboard/route");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest(
        "http://localhost:3000/api/leaderboard?limit=200",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Limit must be between");
    });
  });
});
